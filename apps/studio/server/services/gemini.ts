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

const PLAN_PROMPT = `You are an SEO copywriter for wakey.care, an e-commerce website selling natural personal care products.

You have identified an SEO opportunity and need to create a specific, executable action plan.

## Opportunity Details
Type: {insightType}
Title: {title}
Description: {description}
Related search queries: {relatedQueries}
Potential impact: {potentialImpact}/100

## Current Website Content
{websiteContent}

## Your Task
Create a detailed action plan with EXACT copy and changes that can be implemented directly.

IMPORTANT RULES:
- Do NOT suggest using external tools (Keyword Planner, Ahrefs, etc.) - we already have the data
- Do NOT give generic SEO advice - be specific to this website
- Do NOT suggest "research" or "analyze" - provide the actual answers
- DO provide exact text that can be copy-pasted
- DO reference specific products by their handle (e.g., /products/deodorant)
- DO write actual meta descriptions, titles, and content snippets

## Output Format

### 1. Quick Wins (implement today)
For each quick win, provide:
- **Page**: Which specific page/product to update (use the handle)
- **Change**: Exact text to add or modify
- **Example**: The actual copy to use

### 2. Content Updates
For each content update:
- **Target page**: URL path or product handle
- **Current issue**: What's missing or wrong
- **New copy**: Exact text to use (write the actual paragraphs, meta descriptions, etc.)

### 3. New Content (if needed)
If a new page is needed:
- **Page type**: Blog post, landing page, or product page
- **Suggested URL**: e.g., /pages/natural-deodorant-guide
- **Title**: Exact H1 title
- **Content outline**: Key sections with example text for each

Be concise but complete. Every suggestion must include the actual text to implement.
`;

export interface InsightForPlan {
  insightType: string;
  title: string;
  description: string;
  relatedQueries: string[];
  potentialImpact: number;
}

/**
 * Generate a detailed action plan for a specific insight
 */
export async function generatePlanForInsight(
  apiKey: string,
  insight: InsightForPlan,
  websiteContent: ContentSummary,
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({model: 'gemini-2.0-flash'});

  // Format website content with product handles for specific references
  const contentFormatted = `
Products (use these handles for specific recommendations):
${websiteContent.products
  .map(
    (p) =>
      `- "${p.title}" → /products/${p.handle}\n  Description: ${p.description.slice(0, 200)}`,
  )
  .join('\n')}

Existing Pages & Articles (content that already exists):
${websiteContent.pages
  .map(
    (p) =>
      `- "${p.title}" (${p.type})\n  Content preview: ${p.content.slice(0, 300)}`,
  )
  .join('\n')}
  `.trim();

  // Build prompt
  const prompt = PLAN_PROMPT.replace('{insightType}', insight.insightType)
    .replace('{title}', insight.title)
    .replace('{description}', insight.description)
    .replace('{relatedQueries}', insight.relatedQueries.join(', '))
    .replace('{potentialImpact}', insight.potentialImpact.toString())
    .replace('{websiteContent}', contentFormatted);

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{text: prompt}],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });

  return result.response.text();
}

const BLOG_POST_PROMPT = `You are a content writer for wakey.care, an e-commerce website selling natural personal care products.

Write a blog post that targets the following SEO opportunity.

## Opportunity Details
Title: {title}
Description: {description}
Target search queries: {relatedQueries}

## Current Website Products
{products}

## Writing Guidelines
- Write in a friendly, informative tone
- Focus on educating the reader about the topic
- Naturally mention relevant wakey.care products where appropriate (use exact product names)
- Include the target keywords naturally throughout the text
- Structure with clear headings (H2, H3)
- Aim for 800-1200 words
- Include a compelling introduction and conclusion
- Add a call-to-action at the end mentioning relevant products

## Output Format
Return the blog post in Markdown format with:
- A compelling H1 title (optimized for the target queries)
- Meta description (max 160 characters) on the first line after the title
- Well-structured content with H2 and H3 headings
- Natural product mentions with links in format [Product Name](/products/handle)

Start with:
# [Title]

Meta: [meta description]

[Content...]
`;

export interface InsightForBlogPost {
  title: string;
  description: string;
  relatedQueries: string[];
}

/**
 * Generate a blog post draft for a content gap insight
 */
export async function generateBlogPostForInsight(
  apiKey: string,
  insight: InsightForBlogPost,
  products: Array<{title: string; handle: string; description: string}>,
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({model: 'gemini-2.0-flash'});

  // Format products
  const productsFormatted = products
    .map(
      (p) =>
        `- "${p.title}" (/products/${p.handle}): ${p.description.slice(0, 150)}`,
    )
    .join('\n');

  // Build prompt
  const prompt = BLOG_POST_PROMPT.replace('{title}', insight.title)
    .replace('{description}', insight.description)
    .replace('{relatedQueries}', insight.relatedQueries.join(', '))
    .replace('{products}', productsFormatted);

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{text: prompt}],
      },
    ],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 4096,
    },
  });

  return result.response.text();
}
