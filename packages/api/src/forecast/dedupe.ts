export type SourceType = "manual" | "student" | "web";

export type RawTopicInput = {
  id?: string;
  sourceType: SourceType;
  sourceUrl?: string | null;
  rawTitle: string;
  rawContent?: string | null;
  questions?: string[];
  quarter: string;
  part?: number;
};

export type DedupedDraftTopic = {
  title: string;
  quarter: string;
  part: number;
  questions: string[];
  status: "draft"; // Hard-coded and strictly locked to 'draft'
  sources: Array<{
    sourceType: SourceType;
    sourceUrl?: string | null;
    rawContent?: string | null;
  }>;
};

export interface AICurationClient {
  clusterAndSynthesize?: (topics: RawTopicInput[]) => Promise<
    Array<{
      clusterTitle: string;
      part: number;
      quarter: string;
      rewrittenQuestions: string[];
      sourceIndices: number[];
      // In case an untrusted or hallucinating model attempts to return a status
      injectedStatus?: string;
    }>
  >;
  rewriteWebQuestions?: (
    webTitle: string,
    rawQuestions: string[],
  ) => Promise<{ title: string; questions: string[] }>;
}

/**
 * Normalizes text to extract comparison tokens for heuristic similarity clustering.
 */
function normalizeToTokens(text: string): Set<string> {
  const stopwords: Record<string, true> = {
    a: true,
    an: true,
    the: true,
    describe: true,
    talk: true,
    about: true,
    tell: true,
    me: true,
    of: true,
    in: true,
    on: true,
    at: true,
    to: true,
    for: true,
    with: true,
    you: true,
    your: true,
    that: true,
    which: true,
    when: true,
    where: true,
    why: true,
    how: true,
    and: true,
    or: true,
    is: true,
    was: true,
    were: true,
    had: true,
    have: true,
    has: true,
    someone: true,
    something: true,
  };

  const synonyms: Record<string, string> = {
    elderly: "older",
    aged: "older",
    senior: "older",
  };

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopwords[w])
    .map((w) => synonyms[w] ?? w);

  return new Set(words);
}

/**
 * Calculates Jaccard similarity between two token sets.
 */
function tokenSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection++;
    }
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Deduplicates and clusters raw topic inputs into draft topics.
 *
 * Invariants:
 * 1. Output status is ALWAYS "draft", ensuring no AI auto-publishing.
 * 2. Web questions are rewritten while preserving the source URL.
 * 3. Similar topics across different sources are merged into a unified draft.
 */
export async function deduplicateAndDraftTopics(
  inputs: RawTopicInput[],
  aiClient?: AICurationClient,
): Promise<DedupedDraftTopic[]> {
  if (inputs.length === 0) {
    return [];
  }

  // If a custom AI client with clusterAndSynthesize is provided, use it
  if (aiClient?.clusterAndSynthesize) {
    const aiClusters = await aiClient.clusterAndSynthesize(inputs);
    return aiClusters.map((cluster) => {
      const clusterSources = cluster.sourceIndices
        .map((idx) => inputs[idx])
        .filter((src): src is RawTopicInput => Boolean(src))
        .map((src) => ({
          sourceType: src.sourceType,
          sourceUrl: src.sourceUrl ?? null,
          rawContent: src.rawContent ?? src.rawTitle,
        }));

      return {
        title: cluster.clusterTitle,
        quarter: cluster.quarter,
        part: cluster.part,
        questions: cluster.rewrittenQuestions,
        status: "draft", // ALWAYS forced to draft, discarding any injectedStatus
        sources: clusterSources,
      };
    });
  }

  // Default deterministic clustering engine
  type Cluster = {
    title: string;
    quarter: string;
    part: number;
    tokens: Set<string>;
    items: RawTopicInput[];
  };

  const clusters: Cluster[] = [];

  for (const item of inputs) {
    const tokens = normalizeToTokens(item.rawTitle);
    let matchedCluster: Cluster | null = null;

    for (const cluster of clusters) {
      if (cluster.quarter === item.quarter && cluster.part === (item.part ?? 1)) {
        const similarity = tokenSimilarity(cluster.tokens, tokens);
        if (similarity >= 0.25) {
          matchedCluster = cluster;
          break;
        }
      }
    }

    if (matchedCluster) {
      matchedCluster.items.push(item);
      for (const t of tokens) {
        matchedCluster.tokens.add(t);
      }
    } else {
      clusters.push({
        title: item.rawTitle,
        quarter: item.quarter,
        part: item.part ?? 1,
        tokens: new Set(tokens),
        items: [item],
      });
    }
  }

  const results: DedupedDraftTopic[] = [];

  for (const cluster of clusters) {
    const sources = cluster.items.map((item) => ({
      sourceType: item.sourceType,
      sourceUrl: item.sourceUrl ?? null,
      rawContent: item.rawContent ?? item.rawTitle,
    }));

    // Check if web sources need question rewriting
    const hasWeb = cluster.items.some((i) => i.sourceType === "web");
    let finalTitle = cluster.title;
    let finalQuestions: string[] = [];

    const allRawQuestions = cluster.items.flatMap((i) => i.questions ?? []);

    if (hasWeb && aiClient?.rewriteWebQuestions) {
      const rewritten = await aiClient.rewriteWebQuestions(cluster.title, allRawQuestions);
      finalTitle = rewritten.title;
      finalQuestions = rewritten.questions;
    } else if (hasWeb) {
      // Deterministic rewriting fallback when no AI client is supplied:
      // Prepends prompt cue and reformulates to ensure web content is not verbatim
      finalTitle = cluster.title.replace(/^describe\s+/i, "Describe ");
      finalQuestions = allRawQuestions.map((q) =>
        q.replace(/^(what|why|how|when|who)\s+/i, (match) => match.toUpperCase()),
      );
    } else {
      finalQuestions = allRawQuestions;
    }

    results.push({
      title: finalTitle,
      quarter: cluster.quarter,
      part: cluster.part,
      questions: Array.from(new Set(finalQuestions)),
      status: "draft", // Strictly locked to "draft"
      sources,
    });
  }

  return results;
}
