from __future__ import annotations

import json
import math
from pathlib import Path
import struct
import subprocess
import wave

import pytest
from scrapling.engines.toolbelt.custom import Response

import scraper

FIXTURES_DIR = Path(__file__).parent / "fixtures"
REPO_ROOT = Path(__file__).resolve().parents[2]


def _make_response(
    url: str,
    content: bytes | str,
    status: int = 200,
    headers: dict[str, str] | None = None,
) -> Response:
    return Response(
        url=url,
        content=content,
        status=status,
        reason="OK" if status < 400 else "Error",
        cookies={},
        headers=headers or {},
        request_headers={},
    )


def _create_synthetic_stereo_wav(path: Path, duration_sec: float = 0.25) -> None:
    sample_rate = 44100
    num_channels = 2
    num_frames = int(sample_rate * duration_sec)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(num_channels)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        frames = bytearray()
        for i in range(num_frames):
            val = int(12000 * math.sin(2.0 * math.pi * 440.0 * i / sample_rate))
            frames.extend(struct.pack("<hh", val, -val))
        wf.writeframes(bytes(frames))


def test_parse_engnovate_article_html_with_scrapling() -> None:
    html = (FIXTURES_DIR / "engnovate_article.html").read_text(encoding="utf-8")
    url = "https://engnovate.com/ielts-speaking-samples/describe-a-useful-website/"

    sample = scraper.parse_engnovate_article_html(html, url)

    assert sample is not None
    assert sample.sample_id == "engnovate_describe-a-useful-website"
    assert sample.source == "engnovate"
    assert sample.source_url == url
    assert sample.mode == "part"
    assert sample.part == 2
    assert sample.topic == "Technology"
    assert sample.overall_band == 7.5
    assert sample.question == "Describe a website that you find very useful."
    assert (
        sample.audio_url
        == "https://engnovate.com/wp-content/uploads/2025/01/useful-website-s1.mp3"
    )
    assert "Wikipedia" in sample.transcript
    assert "presentation" in sample.transcript
    assert "second sample answer" not in sample.transcript
    assert sample.feedback is not None
    assert "Vocabulary" in sample.feedback
    assert "rely on" in sample.feedback


def test_parse_engnovate_article_html_rejects_file_and_forbidden_audio_urls() -> None:
    html_file_audio = """
    <html><body>
      <h1 class="entry-title">Band-8.0 IELTS Speaking Part 3: Remote Work</h1>
      <div class="ast-terms-link"><a href="/t/work">Work</a></div>
      <div class="entry-content">
        <h2>Sample 1</h2>
        <figure class="wp-block-audio"><audio src="file:///etc/passwd"></audio></figure>
        <p>Remote work allows greater flexibility for knowledge workers.</p>
      </div>
    </body></html>
    """
    sample = scraper.parse_engnovate_article_html(
        html_file_audio, "https://engnovate.com/ielts-speaking-samples/remote-work/"
    )
    assert sample is not None
    assert sample.overall_band == 8.0
    assert sample.part == 3
    assert sample.topic == "Work"
    assert sample.question == "Remote Work"
    assert sample.audio_url is None


def test_parse_hf_metadata_stratified_and_size_sorted() -> None:
    jsonl_text = (FIXTURES_DIR / "hf_metadata.jsonl").read_text(encoding="utf-8") + (
        "\n{not-valid-json\n\"just a string\"\n"
    )
    size_map = {
        "band65_large.wav": 900_000,
        "band65_small.wav": 120_000,
        "band80_small.wav": 150_000,
        "band80_large.wav": 850_000,
        "band55_only.wav": 400_000,
    }

    stratified = scraper.parse_hf_metadata_jsonl(
        jsonl_text=jsonl_text,
        size_map=size_map,
        limit=4,
        stratify=True,
    )

    assert len(stratified) == 4
    assert [s.sample_id for s in stratified[:3]] == [
        "hf_band55_only",
        "hf_band65_small",
        "hf_band80_small",
    ]
    assert stratified[3].sample_id == "hf_band65_large"
    assert all(s.mode == "full" and s.part is None for s in stratified)
    assert all(s.audio_url and s.audio_url.endswith(".wav") for s in stratified)
    assert all("/data/data/" not in (s.audio_url or "") for s in stratified)

    unstratified = scraper.parse_hf_metadata_jsonl(
        jsonl_text=jsonl_text,
        size_map=size_map,
        limit=3,
        stratify=False,
    )
    assert [s.sample_id for s in unstratified] == [
        "hf_band65_small",
        "hf_band80_small",
        "hf_band55_only",
    ]


def test_robots_txt_disallow_and_status_edge_cases(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    robots_body = (FIXTURES_DIR / "robots.txt").read_text(encoding="utf-8")
    scraper._ROBOTS_CACHE.clear()
    calls: list[str] = []

    def fake_get(url: str, **_kwargs: object) -> Response:
        calls.append(url)
        if url == "https://deny403.example/robots.txt":
            return _make_response(url, "", status=403)
        if url == "https://missing404.example/robots.txt":
            return _make_response(url, "", status=404)
        if url == "https://broken0.example/robots.txt":
            return _make_response(url, "", status=0)
        if url == "https://error500.example/robots.txt":
            return _make_response(url, "", status=503)
        return _make_response(url, robots_body.encode("utf-8"), status=200)

    monkeypatch.setattr(scraper.Fetcher, "get", staticmethod(fake_get))

    scraper.ensure_robots_allowed("https://example.org/public/item")
    scraper.ensure_robots_allowed("https://example.org/public/other")
    assert calls == ["https://example.org/robots.txt"]

    with pytest.raises(PermissionError):
        scraper.ensure_robots_allowed("https://example.org/private/secret")

    with pytest.raises(PermissionError):
        scraper.ensure_robots_allowed("https://example.org/agent-blocked/page")

    with pytest.raises(PermissionError):
        scraper.ensure_robots_allowed("https://luyennoi.com/question-answer/test")

    with pytest.raises(PermissionError):
        scraper.ensure_robots_allowed("https://deny403.example/anything")

    # 404 robots.txt allows fetching per RFC 9309
    scraper.ensure_robots_allowed("https://missing404.example/anything")

    # status=0 and 5xx fail closed instead of treating empty body as 200 Allow All
    with pytest.raises(RuntimeError):
        scraper.ensure_robots_allowed("https://broken0.example/anything")
    with pytest.raises(RuntimeError):
        scraper.ensure_robots_allowed("https://error500.example/anything")


def test_http_get_checks_redirects_against_forbidden_domains(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    scraper._ROBOTS_CACHE.clear()

    def fake_get(url: str, **_kwargs: object) -> Response:
        if url == "https://redirector.example/robots.txt":
            return _make_response(url, "User-agent: *\nAllow: /\n", status=200)
        if url == "https://redirector.example/start":
            return _make_response(
                url,
                "",
                status=302,
                headers={"Location": "https://luyennoi.com/question-answer/trap"},
            )
        return _make_response(url, "", status=404)

    monkeypatch.setattr(scraper.Fetcher, "get", staticmethod(fake_get))

    with pytest.raises(PermissionError):
        scraper._http_get("https://redirector.example/start")


def test_export_to_scoring_eval_wav_spec_and_csv_protection(
    tmp_path: Path,
) -> None:
    src_wav = tmp_path / "source_44k_stereo.wav"
    _create_synthetic_stereo_wav(src_wav, duration_sec=0.3)

    audio_dir = tmp_path / "audio"
    csv_path = tmp_path / "samples.public.csv"
    official_csv = tmp_path / "samples.csv"
    official_csv.write_text("sample_id,mode,consent_ref,human_band\n", encoding="utf-8")
    symlink_csv = tmp_path / "alias.public.csv"
    symlink_csv.symlink_to(official_csv)

    valid_sample = scraper.SpeakingSample(
        sample_id="test_public_001",
        source="engnovate",
        source_url="https://engnovate.com/ielts-speaking-samples/test/",
        mode="part",
        part=2,
        topic="Technology",
        question="Describe a tool.",
        transcript="A sample transcript for testing.",
        overall_band=7.5,
        criteria=None,
        feedback=None,
        audio_url=src_wav.as_uri(),
    )
    no_audio_sample = scraper.SpeakingSample(
        sample_id="test_no_audio",
        source="engnovate",
        source_url="https://engnovate.com/ielts-speaking-samples/no-audio/",
        mode="part",
        part=1,
        topic="Work",
        question="Do you work?",
        transcript="Yes, I work as an engineer.",
        overall_band=6.0,
        criteria=None,
        feedback=None,
        audio_url=None,
    )

    # file:// audio URLs must be rejected unless explicitly enabled
    with pytest.raises(PermissionError, match="file://"):
        scraper.export_to_scoring_eval(
            [valid_sample],
            audio_dir=audio_dir,
            csv_path=csv_path,
        )

    # Hard protection against overwriting official OQ-5 samples.csv (direct and via symlink)
    with pytest.raises(ValueError, match="samples\\.csv"):
        scraper.export_to_scoring_eval(
            [valid_sample],
            audio_dir=audio_dir,
            csv_path=official_csv,
            allow_file_urls=True,
        )

    with pytest.raises(ValueError, match="samples\\.csv"):
        scraper.export_to_scoring_eval(
            [valid_sample],
            audio_dir=audio_dir,
            csv_path=symlink_csv,
            allow_file_urls=True,
        )

    exported = scraper.export_to_scoring_eval(
        [valid_sample, no_audio_sample],
        audio_dir=audio_dir,
        csv_path=csv_path,
        max_audio_seconds=1,
        allow_file_urls=True,
    )

    assert len(exported) == 1
    out_wav = audio_dir / "test_public_001.wav"
    assert out_wav.is_file()
    assert valid_sample.local_audio_path == str(out_wav)
    assert scraper.validate_wav_16k_mono_pcm(out_wav, max_audio_seconds=1) is True

    with wave.open(str(out_wav), "rb") as wf:
        assert wf.getnchannels() == 1
        assert wf.getsampwidth() == 2
        assert wf.getframerate() == 16000
        assert wf.getnframes() > 0

    csv_text = csv_path.read_text(encoding="utf-8")
    assert csv_text == (
        "sample_id,mode,consent_ref,human_band\n"
        "test_public_001,part,public_benchmark_td01,7.5\n"
    )

    # Verify generated samples.public.csv passes report.ts parseSamplesCsv
    report_ts = REPO_ROOT / "scripts" / "scoring-eval" / "report.ts"
    local_zod = REPO_ROOT / "node_modules" / "zod"
    fallback_zod: Path | None = None
    if not local_zod.exists():
        common_git = subprocess.run(
            ["git", "-C", str(REPO_ROOT), "rev-parse", "--git-common-dir"],
            capture_output=True,
            text=True,
            check=False,
        )
        if common_git.returncode == 0 and common_git.stdout.strip():
            git_dir = Path(common_git.stdout.strip())
            if not git_dir.is_absolute():
                git_dir = (REPO_ROOT / git_dir).resolve()
            fallback_zod = git_dir.parent / "node_modules" / "zod" / "index.js"

    if local_zod.exists():
        node_script = (
            f"import {{ parseSamplesCsv }} from {json.dumps(report_ts.as_uri())};"
            f"import * as fs from 'node:fs';"
            f"const rows = parseSamplesCsv(fs.readFileSync({json.dumps(str(csv_path))}, 'utf-8'));"
            f"console.log(JSON.stringify(rows));"
        )
    elif fallback_zod and fallback_zod.exists():
        node_script = (
            "import { registerHooks } from 'node:module';"
            "import * as fs from 'node:fs';"
            f"const zodUrl = {json.dumps(fallback_zod.as_uri())};"
            "registerHooks({ resolve(spec, ctx, next) { "
            "if (spec === 'zod') return { shortCircuit: true, url: zodUrl }; "
            "return next(spec, ctx); } });"
            f"const {{ parseSamplesCsv }} = await import({json.dumps(report_ts.as_uri())});"
            f"const rows = parseSamplesCsv(fs.readFileSync({json.dumps(str(csv_path))}, 'utf-8'));"
            "console.log(JSON.stringify(rows));"
        )
    else:
        pytest.skip(
            "zod not installed in node_modules; run pnpm install to verify report.ts integration"
        )

    proc = subprocess.run(
        ["node", "--experimental-strip-types", "--input-type=module", "-e", node_script],
        capture_output=True,
        text=True,
        check=True,
    )
    parsed_rows = json.loads(proc.stdout.strip())
    assert parsed_rows == [
        {
            "sample_id": "test_public_001",
            "mode": "part",
            "consent_ref": "public_benchmark_td01",
            "human_band": 7.5,
        }
    ]


def test_helpers_and_cli_roundtrip(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    assert scraper.is_valid_half_band(0.0) is True
    assert scraper.is_valid_half_band(6.5) is True
    assert scraper.is_valid_half_band(9) is True
    assert scraper.is_valid_half_band(6.3) is False
    assert scraper.is_valid_half_band(9.5) is False
    assert scraper.is_valid_half_band(True) is False
    assert scraper.is_valid_half_band(None) is False

    assert scraper.sanitize_sample_id("___hello world!! 123___") == "hello_world_123"
    with pytest.raises(ValueError):
        scraper.sanitize_sample_id("___...___")

    src_wav = tmp_path / "cli_src.wav"
    _create_synthetic_stereo_wav(src_wav, duration_sec=0.2)

    mock_sample = scraper.SpeakingSample(
        sample_id="cli_sample_1",
        source="hf-ielts-wav",
        source_url=scraper.HF_DATASET_URL,
        mode="full",
        part=None,
        topic="IELTS Speaking Full Interview",
        question="Examiner-led speaking interview (Parts 1-3)",
        transcript="Sample CLI transcript.",
        overall_band=6.5,
        criteria=None,
        feedback=None,
        audio_url="https://example.org/cli_sample_1.wav",
    )

    monkeypatch.setattr(
        scraper,
        "fetch_hf_ielts_samples",
        lambda limit=10, stratify=True, delay_seconds=0.5: [mock_sample],
    )
    monkeypatch.setattr(
        scraper,
        "_download_audio_bytes",
        lambda _url, **_kwargs: src_wav.read_bytes(),
    )

    out_json = tmp_path / "out.json"
    audio_dir = tmp_path / "audio"
    csv_path = tmp_path / "samples.public.csv"

    rc = scraper.main(
        [
            "--source",
            "hf-ielts-wav",
            "--limit",
            "1",
            "--output-json",
            str(out_json),
            "--export-scoring-eval",
            "--audio-dir",
            str(audio_dir),
            "--csv-path",
            str(csv_path),
            "--delay-seconds",
            "0",
        ]
    )
    assert rc == 0
    saved = json.loads(out_json.read_text(encoding="utf-8"))
    assert saved["meta"]["count"] == 1
    assert saved["meta"]["sources"] == ["hf-ielts-wav"]
    assert len(saved["samples"]) == 1
    assert saved["samples"][0]["local_audio_path"] == str(audio_dir / "cli_sample_1.wav")


def test_fetch_sources_dedup_engnovate_ids_and_scrape_all_offline(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    scraper._ROBOTS_CACHE.clear()
    eng_html = (FIXTURES_DIR / "engnovate_article.html").read_text(encoding="utf-8")
    hf_jsonl = (FIXTURES_DIR / "hf_metadata.jsonl").read_text(encoding="utf-8")

    # Two distinct Engnovate URLs sharing the same trailing slug -> sample_id must be deduplicated
    listing_html = """
    <html><body>
      <h2 class="post-title"><a href="https://engnovate.com/2025/describe-a-useful-website/" rel="bookmark">Website 1</a></h2>
      <h2 class="post-title"><a href="https://engnovate.com/2026/describe-a-useful-website/" rel="bookmark">Website 2</a></h2>
    </body></html>
    """
    hf_page_html = (
        "<html><head><title>HF Dataset</title></head><body><h1>IELTS Dataset</h1></body></html>"
    )
    hf_tree_json = json.dumps([{"path": "data/band65_small.wav", "size": 1000}])

    def fake_get(url: str, **_kwargs: object) -> Response:
        if url.endswith("/robots.txt"):
            return _make_response(url, "User-agent: *\nAllow: /\n", status=200)
        if url == scraper.HF_DATASET_URL:
            return _make_response(url, hf_page_html, status=200)
        if url == scraper.HF_METADATA_URL:
            return _make_response(url, hf_jsonl, status=200)
        if url == scraper.HF_TREE_API_URL:
            return _make_response(url, hf_tree_json, status=200)
        if url == scraper.ENGNOVATE_LISTING_BASE_URL:
            return _make_response(url, listing_html, status=200)
        if url in (
            "https://engnovate.com/2025/describe-a-useful-website/",
            "https://engnovate.com/2026/describe-a-useful-website/",
        ):
            return _make_response(url, eng_html, status=200)
        return _make_response(url, "", status=404)

    monkeypatch.setattr(scraper.Fetcher, "get", staticmethod(fake_get))

    results = scraper.scrape_speaking_samples(
        source="all",
        limit=2,
        stratify=True,
        delay_seconds=0.0,
    )

    assert len(results) == 4
    hf_ids = [r.sample_id for r in results if r.source == "hf-ielts-wav"]
    eng_ids = [r.sample_id for r in results if r.source == "engnovate"]
    assert len(hf_ids) == 2
    assert eng_ids == [
        "engnovate_describe-a-useful-website",
        "engnovate_describe-a-useful-website_2",
    ]
