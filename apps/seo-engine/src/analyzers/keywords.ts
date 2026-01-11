export interface KeywordCluster {
  primary: string;
  keywords: string[];
}

/**
 * Simple keyword clustering based on common words
 * Groups keywords that share 50%+ of their words
 */
export function clusterKeywords(keywords: string[]): KeywordCluster[] {
  const clusters: KeywordCluster[] = [];
  const assigned = new Set<string>();

  for (const keyword of keywords) {
    if (assigned.has(keyword)) continue;

    const cluster: KeywordCluster = {
      primary: keyword,
      keywords: [keyword],
    };

    assigned.add(keyword);

    // Find similar keywords
    const words = new Set(keyword.toLowerCase().split(/\s+/));

    for (const other of keywords) {
      if (assigned.has(other)) continue;

      const otherWords = new Set(other.toLowerCase().split(/\s+/));
      const similarity = calculateSimilarity(words, otherWords);

      if (similarity >= 0.5) {
        cluster.keywords.push(other);
        assigned.add(other);
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

function calculateSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);

  // Jaccard similarity
  return intersection.size / union.size;
}
