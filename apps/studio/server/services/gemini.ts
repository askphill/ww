/**
 * Gemini AI Service for Opportunity Analysis
 * Analyzes GSC data against website content to identify growth opportunities
 */

import {GoogleGenerativeAI} from '@google/generative-ai';

export interface GscQueryData {
  query: string;
  impressions: number;
  clicks: number;
  position: number;
  ctr: number;
}

export interface ContentSummary {
  products: Array<{
    title: string;
    handle: string;
    description: string;
  }>;
  pages: Array<{
    title: string;
    type: string;
    content: string;
  }>;
}

export interface GeneratedInsight {
  insightType: 'content_gap' | 'position_opportunity' | 'ctr_improvement';
  title: string;
  description: string;
  relatedQueries: string[];
  potentialImpact: number;
  recommendedAction: string;
  matchingExistingContent?: string[]; // URLs or titles of existing content that partially covers this topic
}

const ANALYSIS_PROMPT = `You are an SEO expert analyzing Google Search Console data for wakey.care, an e-commerce website selling natural personal care products (deodorant, skincare, etc.).

Your task is to generate concrete, actionable insights based on the GSC data and current website content.

## Current Website Content
{websiteContent}

## Google Search Console Data (Top Queries)
{gscData}

## Analyze the data and identify opportunities in these categories:

1. **Content Gaps** (content_gap): High-impression queries with no matching content on the website
2. **Position Opportunities** (position_opportunity): Queries at position 5-20 with high impressions that can be improved
3. **CTR Improvements** (ctr_improvement): Queries with good position but low CTR

## Output Format

Generate 3-7 insights in JSON format:

\`\`\`json
{
  "insights": [
    {
      "insightType": "content_gap" | "position_opportunity" | "ctr_improvement",
      "title": "Short, clear title (max 60 characters)",
      "description": "Detailed description of the insight and why it matters",
      "relatedQueries": ["query1", "query2"],
      "potentialImpact": 0-100,
      "recommendedAction": "Specific action to take",
      "matchingExistingContent": ["Article Title 1", "Article Title 2"]
    }
  ]
}
\`\`\`

IMPORTANT for matchingExistingContent:
- For EVERY insight, check if any existing articles/pages partially cover the topic
- If yes, list them in matchingExistingContent (use exact titles from the Pages & Articles list)
- If no matching content exists, use an empty array []
- This helps identify which content already exists vs. what truly needs to be created

## Guidelines
- Focus on insights that can directly increase revenue
- Be specific about which content needs to be created or improved
- potentialImpact is based on impressions and improvement potential
- Write in English
- Only provide real opportunities, no generic advice
- IMPORTANT: Check the "Pages & Articles" section before flagging anything as a content_gap
  - If an article or page already covers a topic, do NOT flag it as content_gap
  - Instead, consider if the existing content needs optimization (position_opportunity or ctr_improvement)
`;

/**
 * Analyze opportunities using Gemini AI
 */
export async function analyzeOpportunitiesWithAI(
  apiKey: string,
  gscQueries: GscQueryData[],
  websiteContent: ContentSummary,
): Promise<GeneratedInsight[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({model: 'gemini-2.0-flash'});

  // Format GSC data for prompt
  const gscDataFormatted = gscQueries
    .slice(0, 100) // Limit to top 100 queries
    .map(
      (q) =>
        `- "${q.query}": ${q.impressions} impressions, ${q.clicks} clicks, position ${q.position.toFixed(1)}, CTR ${(q.ctr * 100).toFixed(1)}%`,
    )
    .join('\n');

  // Format website content including page/article content
  const contentFormatted = `
Products:
${websiteContent.products
  .map(
    (p) => `- ${p.title} (handle: ${p.handle}): ${p.description.slice(0, 150)}`,
  )
  .join('\n')}

Pages & Articles (existing content on the website):
${websiteContent.pages
  .map((p) => `- ${p.title} (${p.type}): ${p.content.slice(0, 300)}`)
  .join('\n')}
  `.trim();

  // Build prompt
  const prompt = ANALYSIS_PROMPT.replace(
    '{websiteContent}',
    contentFormatted,
  ).replace('{gscData}', gscDataFormatted);

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{text: prompt}],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    });

    const response = result.response.text();

    // Extract JSON from response
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      console.error('Failed to parse AI response - no JSON found');
      return [];
    }

    const parsed = JSON.parse(jsonMatch[1]) as {insights: GeneratedInsight[]};
    return parsed.insights;
  } catch (error) {
    console.error('Error analyzing with Gemini:', error);
    throw error;
  }
}
