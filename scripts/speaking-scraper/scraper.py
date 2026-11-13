from __future__ import annotations

import argparse
from collections import defaultdict
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
import json
import math
import os
from pathlib import Path
import re
import subprocess
import tempfile
import time
from typing import Any, Literal, Sequence
from urllib.parse import quote, urljoin, urlparse
from urllib.request import url2pathname
from urllib.robotparser import RobotFileParser
import wave

from scrapling.fetchers import Fetcher
from scrapling.parser import Adaptor, Selector

DEFAULT_USER_AGENT = "VoxFlowLocalResearch/1.0"
REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT_JSON = REPO_ROOT / "raw-data" / "speaking-samples-public.json"
DEFAULT_AUDIO_DIR = REPO_ROOT / "scripts" / "scoring-eval" / "audio"
DEFAULT_CSV_PATH = REPO_ROOT / "scripts" / "scoring-eval" / "samples.public.csv"

HF_DATASET_URL = (
    "https://huggingface.co/datasets/Amanafif554/IELTS-Dataset-WAV-and-Trasnscription"
)
HF_METADATA_URL = (
    "https://huggingface.co/datasets/Amanafif554/IELTS-Dataset-WAV-and-Trasnscription/raw/main/data/metadata.jsonl"
)
HF_TREE_API_URL = (
    "https://huggingface.co/api/datasets/Amanafif554/IELTS-Dataset-WAV-and-Trasnscription/tree/main/data"
)
HF_RESOLVE_BASE_URL = (
    "https://huggingface.co/datasets/Amanafif554/IELTS-Dataset-WAV-and-Trasnscription/resolve/main/data/"
)
ENGNOVATE_LISTING_BASE_URL = "https://engnovate.com/ielts-speaking-samples/"
PUBLIC_CONSENT_REF = "public_benchmark_td01"

SAMPLE_ID_RE = re.compile(r"^[a-zA-Z0-9_-]+$")
FORBIDDEN_DOMAINS = ("luyennoi.com",)
ALLOWED_HTTP_SCHEMES = ("http", "https")

_ROBOTS_CACHE: dict[str, RobotFileParser] = {}


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def is_valid_half_band(value: float | int | None) -> bool:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return False
    numeric = float(value)
    if not math.isfinite(numeric):
        return False
    return 0.0 <= numeric <= 9.0 and (numeric * 2.0).is_integer()


@dataclass
class SpeakingSample:
    sample_id: str
    source: Literal["hf-ielts-wav", "engnovate"]
    source_url: str
    mode: Literal["full", "part"]
    part: int | None
    topic: str
    question: str
    transcript: str
    overall_band: float
    criteria: dict[str, float] | None
    feedback: str | None
    audio_url: str | None
    local_audio_path: str | None = None
    scraped_at: str = field(default_factory=_utc_now_iso)

    def __post_init__(self) -> None:
        if not SAMPLE_ID_RE.fullmatch(self.sample_id):
            raise ValueError(
                f"Invalid sample_id {self.sample_id!r}: must match ^[a-zA-Z0-9_-]+$"
            )
        if self.mode not in ("full", "part"):
            raise ValueError(f"Invalid mode {self.mode!r}: expected 'full' or 'part'")
        if self.part not in (None, 1, 2, 3):
            raise ValueError(f"Invalid part {self.part!r}: expected None, 1, 2, or 3")
        if not is_valid_half_band(self.overall_band):
            raise ValueError(
                f"Invalid overall_band {self.overall_band!r}: expected 0.0..9.0 in 0.5 steps"
            )


def sanitize_sample_id(raw: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_-]", "_", raw)
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    if not cleaned:
        raise ValueError(f"Cannot sanitize empty sample_id from {raw!r}")
    return cleaned


def _allocate_unique_id(base_id: str, seen_ids: set[str]) -> str:
    candidate = base_id
    suffix = 2
    while candidate in seen_ids:
        candidate = f"{base_id}_{suffix}"
        suffix += 1
    seen_ids.add(candidate)
    return candidate


def _coerce_band(value: Any) -> float | None:
    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value) if is_valid_half_band(value) else None
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return None
        try:
            parsed = float(stripped)
        except ValueError:
            return None
        return parsed if is_valid_half_band(parsed) else None
    return None


def _is_http_url(url: str) -> bool:
    parsed = urlparse(url)
    return parsed.scheme.lower() in ALLOWED_HTTP_SCHEMES and bool(parsed.netloc)


def _assert_allowed_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme.lower() not in ALLOWED_HTTP_SCHEMES or not parsed.netloc:
        raise ValueError(f"Unsupported or invalid HTTP URL: {url!r}")
    hostname = (parsed.hostname or "").lower()
    if any(hostname == d or hostname.endswith(f".{d}") for d in FORBIDDEN_DOMAINS):
        raise PermissionError(f"Access to forbidden domain is disallowed: {url}")


def _extract_status(resp: Any) -> int:
    raw_status = getattr(resp, "status", None)
    if raw_status is None or isinstance(raw_status, bool):
        raise RuntimeError("HTTP response missing status code")
    status = int(raw_status)
    if status <= 0:
        raise RuntimeError(f"Invalid HTTP transport status code: {status}")
    return status


def _get_header(resp: Any, name: str) -> str | None:
    headers = getattr(resp, "headers", None)
    if not isinstance(headers, dict):
        return None
    target = name.lower()
    for key, val in headers.items():
        if str(key).lower() == target and isinstance(val, str):
            return val
    return None


def _response_bytes(resp: Any) -> bytes:
    body = getattr(resp, "body", None)
    if isinstance(body, bytes):
        return body
    if isinstance(body, str):
        return body.encode("utf-8")
    text = getattr(resp, "text", None)
    if isinstance(text, str):
        return text.encode("utf-8")
    html_content = getattr(resp, "html_content", None)
    if isinstance(html_content, str):
        return html_content.encode("utf-8")
    return b""


def _response_text(resp: Any) -> str:
    body = getattr(resp, "body", None)
    encoding = getattr(resp, "encoding", None) or "utf-8"
    if isinstance(body, bytes):
        return body.decode(encoding, errors="replace")
    if isinstance(body, str):
        return body
    text = getattr(resp, "text", None)
    if isinstance(text, str) and text:
        return text
    html_content = getattr(resp, "html_content", None)
    if isinstance(html_content, str):
        return html_content
    return ""


def _http_get(
    url: str,
    user_agent: str = DEFAULT_USER_AGENT,
    timeout: int = 30,
    *,
    check_robots: bool = True,
    max_redirects: int = 5,
) -> Any:
    current_url = url
    for _ in range(max_redirects + 1):
        _assert_allowed_url(current_url)
        if check_robots:
            ensure_robots_allowed(current_url, user_agent=user_agent)

        resp = Fetcher.get(
            current_url,
            headers={"User-Agent": user_agent},
            timeout=timeout,
            follow_redirects=False,
        )
        status = _extract_status(resp)

        final_url = getattr(resp, "url", None)
        if isinstance(final_url, str) and final_url:
            _assert_allowed_url(final_url)

        if 300 <= status < 400:
            location = _get_header(resp, "location")
            if not location:
                return resp
            current_url = urljoin(current_url, location.strip())
            continue

        return resp

    raise RuntimeError(f"Exceeded max redirects ({max_redirects}) for {url}")


def ensure_robots_allowed(
    url: str,
    user_agent: str = DEFAULT_USER_AGENT,
) -> None:
    _assert_allowed_url(url)
    parsed = urlparse(url)
    origin = f"{parsed.scheme}://{parsed.netloc}"

    rp = _ROBOTS_CACHE.get(origin)
    if rp is None:
        robots_url = f"{origin}/robots.txt"
        rp = RobotFileParser()
        rp.set_url(robots_url)
        resp = _http_get(
            robots_url,
            user_agent=user_agent,
            timeout=15,
            check_robots=False,
        )
        status = _extract_status(resp)
        if status in (401, 403):
            rp.disallow_all = True
        elif 400 <= status < 500:
            rp.allow_all = True
        elif status >= 500:
            raise RuntimeError(
                f"robots.txt check failed with server error ({status}) at {robots_url}"
            )
        else:
            rp.parse(_response_text(resp).splitlines())
        _ROBOTS_CACHE[origin] = rp

    if not (rp.can_fetch("*", url) and rp.can_fetch(user_agent, url)):
        raise PermissionError(
            f"robots.txt disallows fetching {url} for user-agent {user_agent!r}"
        )


def _clean_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _element_text(element: Selector | Adaptor) -> str:
    return _clean_whitespace(str(element.get_all_text(separator="", strip=False)))


def _atomic_write_text(target: Path, content: str) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_path_str = tempfile.mkstemp(
        prefix=f".{target.name}.",
        suffix=".tmp",
        dir=str(target.parent),
    )
    tmp_path = Path(tmp_path_str)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write(content)
        os.replace(tmp_path, target)
    finally:
        if tmp_path.exists():
            tmp_path.unlink()


def parse_hf_metadata_jsonl(
    jsonl_text: str,
    size_map: dict[str, int] | None = None,
    limit: int = 15,
    stratify: bool = True,
) -> list[SpeakingSample]:
    if limit <= 0:
        return []

    sizes = size_map or {}
    candidates: list[tuple[float, float, int, SpeakingSample]] = []
    seen_ids: set[str] = set()
    scraped_at = _utc_now_iso()

    for idx, line in enumerate(jsonl_text.splitlines()):
        stripped = line.strip()
        if not stripped:
            continue
        try:
            row = json.loads(stripped)
        except json.JSONDecodeError:
            continue
        if not isinstance(row, dict):
            continue

        file_name_raw = row.get("file_name")
        transcription_raw = row.get("transcription")
        band = _coerce_band(row.get("band_score"))

        if not isinstance(file_name_raw, str):
            continue
        file_name = file_name_raw.strip()
        if not file_name or not file_name.lower().endswith(".wav"):
            continue
        if not isinstance(transcription_raw, str):
            continue
        transcript = _clean_whitespace(transcription_raw)
        if not transcript or band is None:
            continue

        normalized_rel = file_name.lstrip("/").removeprefix("data/")
        base_id = sanitize_sample_id(f"hf_{Path(normalized_rel).stem}")
        sample_id = _allocate_unique_id(base_id, seen_ids)

        file_size: float = float("inf")
        for key in (normalized_rel, f"data/{normalized_rel}", Path(normalized_rel).name):
            if key in sizes:
                file_size = float(sizes[key])
                break

        sample = SpeakingSample(
            sample_id=sample_id,
            source="hf-ielts-wav",
            source_url=HF_DATASET_URL,
            mode="full",
            part=None,
            topic="IELTS Speaking Full Interview",
            question="Examiner-led speaking interview (Parts 1-3)",
            transcript=transcript,
            overall_band=band,
            criteria=None,
            feedback=None,
            audio_url=HF_RESOLVE_BASE_URL + quote(normalized_rel),
            local_audio_path=None,
            scraped_at=scraped_at,
        )
        candidates.append((band, file_size, idx, sample))

    if not candidates:
        return []

    if not stratify:
        candidates.sort(key=lambda item: (item[1], item[2]))
        return [item[3] for item in candidates[:limit]]

    buckets: dict[float, list[tuple[float, int, SpeakingSample]]] = defaultdict(list)
    for band, file_size, idx, sample in candidates:
        buckets[band].append((file_size, idx, sample))

    for band in buckets:
        buckets[band].sort(key=lambda item: (item[0], item[1]))

    ordered_bands = sorted(buckets.keys())
    offsets = {band: 0 for band in ordered_bands}
    selected: list[SpeakingSample] = []

    while len(selected) < limit:
        progressed = False
        for band in ordered_bands:
            pos = offsets[band]
            bucket = buckets[band]
            if pos < len(bucket):
                selected.append(bucket[pos][2])
                offsets[band] = pos + 1
                progressed = True
                if len(selected) >= limit:
                    break
        if not progressed:
            break

    return selected


def fetch_hf_ielts_samples(
    limit: int = 15,
    stratify: bool = True,
    user_agent: str = DEFAULT_USER_AGENT,
    delay_seconds: float = 0.5,
) -> list[SpeakingSample]:
    if limit <= 0:
        return []

    dataset_resp = _http_get(HF_DATASET_URL, user_agent=user_agent)
    dataset_status = _extract_status(dataset_resp)
    if dataset_status >= 400:
        raise RuntimeError(
            f"Failed to fetch HuggingFace dataset page ({dataset_status}): {HF_DATASET_URL}"
        )
    dataset_doc = Selector(_response_text(dataset_resp), url=HF_DATASET_URL)
    title_nodes = dataset_doc.css("h1") or dataset_doc.css("title")
    if not title_nodes:
        raise RuntimeError(
            f"Unexpected HuggingFace dataset HTML structure at {HF_DATASET_URL}"
        )

    if delay_seconds > 0:
        time.sleep(delay_seconds)

    metadata_resp = _http_get(HF_METADATA_URL, user_agent=user_agent)
    metadata_status = _extract_status(metadata_resp)
    if metadata_status >= 400:
        raise RuntimeError(
            f"Failed to fetch HuggingFace metadata.jsonl ({metadata_status}): {HF_METADATA_URL}"
        )
    jsonl_text = _response_text(metadata_resp)

    size_map: dict[str, int] = {}
    try:
        if delay_seconds > 0:
            time.sleep(delay_seconds)
        tree_resp = _http_get(HF_TREE_API_URL, user_agent=user_agent)
        if 200 <= _extract_status(tree_resp) < 400:
            entries = json.loads(_response_text(tree_resp))
            if isinstance(entries, list):
                for entry in entries:
                    if not isinstance(entry, dict):
                        continue
                    rel_path = entry.get("path")
                    size_val = entry.get("size")
                    if isinstance(rel_path, str) and isinstance(size_val, int):
                        trimmed = rel_path.removeprefix("data/")
                        size_map[trimmed] = size_val
                        size_map[rel_path] = size_val
                        size_map.setdefault(Path(rel_path).name, size_val)
    except Exception:
        # Size metadata is an optimization for faster downloads; continue if unavailable.
        pass

    return parse_hf_metadata_jsonl(
        jsonl_text=jsonl_text,
        size_map=size_map,
        limit=limit,
        stratify=stratify,
    )


def _strip_quotes(text: str) -> str:
    return text.strip(" \t\r\n\"'“”‘’")


def _extract_audio_src(elements: Sequence[Selector | Adaptor]) -> str | None:
    for el in elements:
        audio_nodes = el.css("figure.wp-block-audio audio")
        if not audio_nodes and el.tag == "audio":
            audio_nodes = [el]
        for audio in audio_nodes:
            src = audio.attrib.get("src")
            if src and src.strip():
                return src.strip()
            for source_tag in audio.css("source"):
                src2 = source_tag.attrib.get("src")
                if src2 and src2.strip():
                    return src2.strip()
    return None


def parse_engnovate_article_html(html: str, url: str) -> SpeakingSample | None:
    doc = Selector(html, url=url)

    title_nodes = doc.css("h1.entry-title")
    title = _element_text(title_nodes[0]) if title_nodes else ""

    term_tags = [_element_text(a) for a in doc.css(".ast-terms-link a")]
    overall_band: float | None = None
    part: int | None = None
    topic: str | None = None

    for tag in term_tags:
        if not tag:
            continue
        band_match = re.search(r"Band\s+(\d+(?:\.\d+)?)", tag, re.IGNORECASE)
        if band_match:
            candidate = _coerce_band(band_match.group(1))
            if candidate is not None and overall_band is None:
                overall_band = candidate
            continue

        part_match = re.search(r"IELTS\s+Speaking\s+Part\s+([123])", tag, re.IGNORECASE)
        if part_match:
            if part is None:
                part = int(part_match.group(1))
            continue

        if topic is None:
            topic = tag

    if overall_band is None and title:
        title_band_match = re.search(r"Band[- ](\d+(?:\.\d+)?)", title, re.IGNORECASE)
        if title_band_match:
            overall_band = _coerce_band(title_band_match.group(1))

    if part is None and title:
        title_part_match = re.search(r"Part\s+([123])", title, re.IGNORECASE)
        if title_part_match:
            part = int(title_part_match.group(1))

    if overall_band is None:
        return None

    content_nodes = doc.css(".entry-content")
    if not content_nodes:
        return None
    content = content_nodes[0]

    question = ""
    q_nodes = content.css("p strong em")
    for q_node in q_nodes:
        candidate_q = _strip_quotes(_element_text(q_node))
        if candidate_q:
            question = candidate_q
            break
    if not question:
        if ":" in title:
            question = _strip_quotes(title.split(":", 1)[1])
        else:
            question = _strip_quotes(title) or "IELTS Speaking Sample"

    children = list(content.children)
    h2_indices = [idx for idx, child in enumerate(children) if child.tag == "h2"]

    if h2_indices:
        start_idx = h2_indices[0] + 1
        end_idx = h2_indices[1] if len(h2_indices) > 1 else len(children)
        sample1_nodes = children[start_idx:end_idx]
    else:
        sample1_nodes = children

    raw_audio_url = _extract_audio_src(sample1_nodes)
    if raw_audio_url is None and not h2_indices:
        raw_audio_url = _extract_audio_src(content.css("figure.wp-block-audio audio"))

    audio_url: str | None = None
    if raw_audio_url:
        resolved = urljoin(url, raw_audio_url)
        if _is_http_url(resolved):
            try:
                _assert_allowed_url(resolved)
                audio_url = resolved
            except (PermissionError, ValueError):
                audio_url = None

    transcript_paragraphs: list[str] = []
    for node in sample1_nodes:
        if node.tag not in ("p", "blockquote"):
            continue
        p_text = _element_text(node)
        if not p_text:
            continue
        # Skip standalone question prompt paragraph when embedded inside Sample 1 block
        if _strip_quotes(p_text) == question and node.css("strong em"):
            continue
        transcript_paragraphs.append(p_text)

    transcript = "\n\n".join(transcript_paragraphs).strip()
    if not transcript:
        return None

    feedback_sections: list[str] = []
    if len(h2_indices) > 1:
        for i in range(1, len(h2_indices)):
            h2_idx = h2_indices[i]
            heading_text = _element_text(children[h2_idx])
            lower_heading = heading_text.lower()
            if re.match(r"^sample\s*\d+", lower_heading):
                continue
            if not any(
                kw in lower_heading
                for kw in ("vocab", "idea", "lexis", "grammar", "feedback", "tip", "note")
            ):
                continue
            sec_end = h2_indices[i + 1] if i + 1 < len(h2_indices) else len(children)
            sec_lines = [heading_text]
            for sec_node in children[h2_idx + 1 : sec_end]:
                if sec_node.tag in ("ul", "ol"):
                    for li in sec_node.css("li"):
                        li_text = _element_text(li)
                        if li_text:
                            sec_lines.append(f"- {li_text}")
                elif sec_node.tag in ("p", "div", "blockquote", "h3"):
                    t = _element_text(sec_node)
                    if t:
                        sec_lines.append(t)
            if len(sec_lines) > 1:
                feedback_sections.append("\n".join(sec_lines))

    feedback = "\n\n".join(feedback_sections) if feedback_sections else None

    slug = urlparse(url).path.rstrip("/").split("/")[-1]
    raw_id = f"engnovate_{slug}" if slug else f"engnovate_{title}"
    sample_id = sanitize_sample_id(raw_id)

    return SpeakingSample(
        sample_id=sample_id,
        source="engnovate",
        source_url=url,
        mode="part",
        part=part,
        topic=topic or "IELTS Speaking Sample",
        question=question,
        transcript=transcript,
        overall_band=overall_band,
        criteria=None,
        feedback=feedback,
        audio_url=audio_url,
        local_audio_path=None,
        scraped_at=_utc_now_iso(),
    )


def fetch_engnovate_samples(
    limit: int = 15,
    delay_seconds: float = 0.5,
    user_agent: str = DEFAULT_USER_AGENT,
    max_pages: int = 50,
) -> list[SpeakingSample]:
    if limit <= 0:
        return []

    samples: list[SpeakingSample] = []
    seen_urls: set[str] = set()
    seen_ids: set[str] = set()

    for page_num in range(1, max_pages + 1):
        if len(samples) >= limit:
            break

        listing_url = (
            ENGNOVATE_LISTING_BASE_URL
            if page_num == 1
            else urljoin(ENGNOVATE_LISTING_BASE_URL, f"page/{page_num}/")
        )

        if page_num > 1 and delay_seconds > 0:
            time.sleep(delay_seconds)

        listing_resp = _http_get(listing_url, user_agent=user_agent)
        if _extract_status(listing_resp) >= 400:
            break

        listing_doc = Selector(_response_text(listing_resp), url=listing_url)
        links = (
            listing_doc.css("h2.post-title a")
            or listing_doc.css("h2.entry-title a")
            or listing_doc.css('a[rel="bookmark"]')
        )
        if not links:
            break

        article_urls: list[str] = []
        for link in links:
            href = link.attrib.get("href")
            if not href:
                continue
            abs_url = urljoin(listing_url, href.strip())
            if not _is_http_url(abs_url):
                continue
            if abs_url not in seen_urls:
                seen_urls.add(abs_url)
                article_urls.append(abs_url)

        if not article_urls:
            break

        for article_url in article_urls:
            if len(samples) >= limit:
                break
            if delay_seconds > 0:
                time.sleep(delay_seconds)

            article_resp = _http_get(article_url, user_agent=user_agent)
            if _extract_status(article_resp) >= 400:
                continue

            parsed = parse_engnovate_article_html(_response_text(article_resp), article_url)
            if parsed is not None:
                parsed.sample_id = _allocate_unique_id(parsed.sample_id, seen_ids)
                samples.append(parsed)

    return samples


def scrape_speaking_samples(
    source: Literal["all", "hf-ielts-wav", "engnovate"] = "all",
    limit: int = 10,
    stratify: bool = True,
    output_json: Path | str | None = None,
    delay_seconds: float = 0.5,
) -> list[SpeakingSample]:
    samples: list[SpeakingSample] = []
    seen_ids: set[str] = set()

    if source in ("all", "hf-ielts-wav"):
        for sample in fetch_hf_ielts_samples(
            limit=limit,
            stratify=stratify,
            delay_seconds=delay_seconds,
        ):
            sample.sample_id = _allocate_unique_id(sample.sample_id, seen_ids)
            samples.append(sample)

    if source in ("all", "engnovate"):
        for sample in fetch_engnovate_samples(
            limit=limit,
            delay_seconds=delay_seconds,
        ):
            sample.sample_id = _allocate_unique_id(sample.sample_id, seen_ids)
            samples.append(sample)

    if output_json is not None:
        _write_samples_json(samples, output_json)

    return samples


def _write_samples_json(samples: Sequence[SpeakingSample], output_json: Path | str) -> None:
    out_path = Path(output_json)
    payload = {
        "meta": {
            "generated_at": _utc_now_iso(),
            "sources": sorted({sample.source for sample in samples}),
            "count": len(samples),
        },
        "samples": [asdict(sample) for sample in samples],
    }
    _atomic_write_text(
        out_path,
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
    )


def validate_wav_16k_mono_pcm(
    wav_path: Path | str,
    max_audio_seconds: int | None = None,
) -> bool:
    path = Path(wav_path)
    if not path.is_file():
        return False
    try:
        with wave.open(str(path), "rb") as wf:
            nframes = wf.getnframes()
            framerate = wf.getframerate()
            if not (
                wf.getnchannels() == 1
                and wf.getsampwidth() == 2
                and framerate == 16000
                and nframes > 0
            ):
                return False
            if max_audio_seconds is not None:
                duration = nframes / float(framerate)
                if duration > float(max_audio_seconds) + 0.25:
                    return False
            return True
    except (wave.Error, EOFError, OSError):
        return False


def _download_audio_bytes(
    audio_url: str,
    user_agent: str = DEFAULT_USER_AGENT,
    *,
    allow_file_urls: bool = False,
) -> bytes:
    parsed = urlparse(audio_url)
    if parsed.scheme.lower() == "file":
        if not allow_file_urls:
            raise PermissionError(
                f"Local file:// audio URLs are disabled by default: {audio_url}"
            )
        local_path = Path(url2pathname(parsed.path))
        return local_path.read_bytes()

    resp = _http_get(audio_url, user_agent=user_agent, timeout=60)
    status = _extract_status(resp)
    if status >= 400:
        raise RuntimeError(f"Failed to download audio ({status}): {audio_url}")
    data = _response_bytes(resp)
    if not data:
        raise RuntimeError(f"Downloaded empty audio payload from {audio_url}")
    return data


def _assert_safe_csv_target(csv_file: Path) -> None:
    official_samples_csv = (REPO_ROOT / "scripts" / "scoring-eval" / "samples.csv").resolve()
    resolved = csv_file.resolve()
    if (
        csv_file.name == "samples.csv"
        or resolved.name == "samples.csv"
        or resolved == official_samples_csv
    ):
        raise ValueError(
            "Refusing to overwrite official OQ-5 samples.csv; use samples.public.csv"
        )


def export_to_scoring_eval(
    samples: Sequence[SpeakingSample],
    audio_dir: Path | str,
    csv_path: Path | str,
    overwrite: bool = False,
    max_audio_seconds: int | None = None,
    delay_seconds: float = 0.5,
    allow_file_urls: bool = False,
) -> list[SpeakingSample]:
    csv_file = Path(csv_path)
    _assert_safe_csv_target(csv_file)

    if max_audio_seconds is not None and max_audio_seconds <= 0:
        raise ValueError("max_audio_seconds must be positive")

    audio_root = Path(audio_dir)
    audio_root.mkdir(parents=True, exist_ok=True)
    csv_file.parent.mkdir(parents=True, exist_ok=True)

    exported: list[SpeakingSample] = []
    seen_export_ids: set[str] = set()
    downloaded_any = False

    for sample in samples:
        if not SAMPLE_ID_RE.fullmatch(sample.sample_id):
            raise ValueError(f"Invalid sample_id {sample.sample_id!r}")
        if sample.mode not in ("full", "part"):
            raise ValueError(f"Invalid mode {sample.mode!r} for {sample.sample_id}")
        if not sample.audio_url or not is_valid_half_band(sample.overall_band):
            continue
        if sample.sample_id in seen_export_ids:
            raise ValueError(f"Duplicate sample_id in export batch: {sample.sample_id!r}")
        seen_export_ids.add(sample.sample_id)

        target_wav = audio_root / f"{sample.sample_id}.wav"
        if not overwrite and validate_wav_16k_mono_pcm(
            target_wav, max_audio_seconds=max_audio_seconds
        ):
            sample.local_audio_path = str(target_wav)
            exported.append(sample)
            continue

        if downloaded_any and delay_seconds > 0:
            time.sleep(delay_seconds)
        raw_bytes = _download_audio_bytes(
            sample.audio_url, allow_file_urls=allow_file_urls
        )
        downloaded_any = True

        src_ext = Path(urlparse(sample.audio_url).path).suffix or ".audio"
        tmp_in: Path | None = None
        tmp_wav = audio_root / f".{sample.sample_id}.{os.getpid()}.tmp.wav"

        try:
            fd_in, tmp_in_str = tempfile.mkstemp(
                prefix=f".{sample.sample_id}_in_",
                suffix=src_ext,
                dir=str(audio_root),
            )
            tmp_in = Path(tmp_in_str)
            with os.fdopen(fd_in, "wb") as f:
                f.write(raw_bytes)

            cmd = ["ffmpeg", "-y", "-v", "error", "-i", str(tmp_in)]
            if max_audio_seconds is not None:
                cmd.extend(["-t", str(max_audio_seconds)])
            cmd.extend(
                [
                    "-ar",
                    "16000",
                    "-ac",
                    "1",
                    "-sample_fmt",
                    "s16",
                    "-c:a",
                    "pcm_s16le",
                    str(tmp_wav),
                ]
            )

            try:
                proc = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    check=False,
                    timeout=120,
                )
            except FileNotFoundError as exc:
                raise RuntimeError("ffmpeg binary not found in PATH") from exc
            except subprocess.TimeoutExpired as exc:
                raise RuntimeError(
                    f"ffmpeg timed out for {sample.sample_id} after 120s"
                ) from exc

            if proc.returncode != 0:
                raise RuntimeError(
                    f"ffmpeg failed for {sample.sample_id}: {proc.stderr.strip()}"
                )

            if not validate_wav_16k_mono_pcm(tmp_wav, max_audio_seconds=max_audio_seconds):
                raise RuntimeError(
                    f"Converted WAV failed 16kHz 16-bit mono validation: {tmp_wav}"
                )

            os.replace(tmp_wav, target_wav)
            sample.local_audio_path = str(target_wav)
            exported.append(sample)
        finally:
            if tmp_in is not None and tmp_in.exists():
                tmp_in.unlink()
            if tmp_wav.exists():
                tmp_wav.unlink()

    lines = ["sample_id,mode,consent_ref,human_band\n"]
    for sample in exported:
        lines.append(
            f"{sample.sample_id},{sample.mode},{PUBLIC_CONSENT_REF},{sample.overall_band:g}\n"
        )
    _atomic_write_text(csv_file, "".join(lines))

    return exported


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Scrape public IELTS Speaking samples for TD-01 pipeline testing."
    )
    parser.add_argument(
        "--source",
        choices=["all", "hf-ielts-wav", "engnovate"],
        default="all",
        help="Source to scrape (default: all)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=10,
        help="Max samples per enabled source (default: 10)",
    )
    parser.add_argument(
        "--no-stratify",
        action="store_true",
        help="Disable band-stratified selection for hf-ielts-wav",
    )
    parser.add_argument(
        "--output-json",
        default=str(DEFAULT_OUTPUT_JSON),
        help="Path to write scraped samples JSON (default: raw-data/speaking-samples-public.json)",
    )
    parser.add_argument(
        "--delay-seconds",
        type=float,
        default=0.5,
        help="Polite delay in seconds between HTTP requests (default: 0.5)",
    )
    parser.add_argument(
        "--export-scoring-eval",
        action="store_true",
        help="Download/convert audio to 16kHz mono WAV and write samples.public.csv",
    )
    parser.add_argument(
        "--audio-dir",
        default=str(DEFAULT_AUDIO_DIR),
        help="Target directory for 16kHz mono WAV files",
    )
    parser.add_argument(
        "--csv-path",
        default=str(DEFAULT_CSV_PATH),
        help="Target CSV path (must not be named samples.csv)",
    )
    parser.add_argument(
        "--max-audio-seconds",
        type=int,
        default=None,
        help="Optional max audio duration in seconds passed to ffmpeg -t",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing valid 16kHz mono WAV files",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_arg_parser()
    args = parser.parse_args(argv)

    samples = scrape_speaking_samples(
        source=args.source,
        limit=args.limit,
        stratify=not args.no_stratify,
        output_json=args.output_json,
        delay_seconds=args.delay_seconds,
    )

    if args.export_scoring_eval:
        exported = export_to_scoring_eval(
            samples=samples,
            audio_dir=args.audio_dir,
            csv_path=args.csv_path,
            overwrite=args.overwrite,
            max_audio_seconds=args.max_audio_seconds,
            delay_seconds=args.delay_seconds,
        )
        if args.output_json is not None:
            _write_samples_json(samples, args.output_json)
        print(
            json.dumps(
                {
                    "scraped": len(samples),
                    "exported_wav": len(exported),
                    "output_json": args.output_json,
                    "csv_path": args.csv_path,
                },
                ensure_ascii=False,
            )
        )
    else:
        print(
            json.dumps(
                {
                    "scraped": len(samples),
                    "output_json": args.output_json,
                },
                ensure_ascii=False,
            )
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
