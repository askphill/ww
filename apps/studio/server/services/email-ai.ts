/**
 * Email AI Service for Template Generation
 * Uses Gemini to generate email templates based on prompts
 */

import {GoogleGenerativeAI} from '@google/generative-ai';
import {
  ComponentType,
  ComponentInstance,
  componentRegistry,
  isValidComponentType,
} from '../email-components';

export interface BrandContext {
  companyName?: string;
  logoUrl?: string;
  websiteUrl?: string;
  address?: string;
}

export interface GeneratedTemplate {
  components: ComponentInstance[];
  suggestedSubject: string;
  suggestedPreviewText: string;
}

// Brand colors from design system
const WAKEY_COLORS = {
  black: '#1a1a1a',
  sand: '#FFF5EB',
  softorange: '#FAD103',
  ocher: '#E3B012',
  skyblue: '#99BDFF',
} as const;

const GENERATION_PROMPT = `You are an email template designer for wakey.care, a personal care brand.

## YOUR TASK
Generate an email template as a JSON array of components based on the user's request.

## WAKEY BRAND VOICE (CRITICAL - FOLLOW EXACTLY)

**Who we are:** The one who actually likes mornings and makes you think maybe you could too.

**Voice attributes:**
1. Cheeky, not childish - Wink and tease, humor lands because it's true
2. Warm, not soft - Care without coddling, say what we mean in few words
3. Real, not raw - Embrace mess without being cynical
4. Confident, not preachy - Know what we stand for without lecturing
5. Specific, not vague - Point to things you can picture, count, or verify

**How we speak:**
- "We" and "you" - direct, never generic
- Keep it short - if a sentence can lose three words, it should
- Point, don't claim - No vague promises. Describe what you'll actually experience.
- Anchor feeling with fact - Sensory first, then one concrete detail
- Find the funny in the familiar - Humor from shared experiences

**NEVER USE:**
- Emojis (NEVER)
- Exclamation marks (almost never)
- Buzzwords: "seamless", "solution", "elevated", "curated", "transform", "revolutionary", "game-changer"
- "Clean beauty" / "Sustainable" as selling points
- "Good" / "Quality" / "Premium" / "Best" - prove it or lose it
- Generic claims a competitor could also say

**The falsifiability test:** Could a bad product say this? If yes, rewrite.
- Bad: "Good stuff" → Good: "Coconut oil from Sri Lanka"
- Bad: "Long lasting" → Good: "Still working at midnight"

## BRAND COLORS (USE THESE EXACTLY)
- Primary background: #1a1a1a (black)
- Light background/text: #FFF5EB (sand)
- Accent/CTA buttons: #FAD103 (softorange/yellow)
- Secondary accent: #E3B012 (ocher)

## AVAILABLE COMPONENTS

{componentSchemas}

## OUTPUT FORMAT

Return a valid JSON object with this structure:
\`\`\`json
{
  "suggestedSubject": "Email subject line (max 60 chars, no emojis, follows brand voice)",
  "suggestedPreviewText": "Preview text (max 100 chars)",
  "components": [
    {
      "id": "unique-id-1",
      "type": "Header",
      "props": { "logoUrl": "...", "backgroundColor": "#1a1a1a" }
    },
    {
      "id": "unique-id-2",
      "type": "Hero",
      "props": { "headline": "...", ... }
    }
  ]
}
\`\`\`

## GUIDELINES

1. Always start with a Header component
2. Always end with a Footer component (use {{unsubscribeUrl}} for unsubscribe link)
3. Use the brand colors consistently
4. Keep copy short and punchy - Wakey voice
5. Use {{firstName}} for personalization where appropriate
6. Generate 3-6 components (excluding Header/Footer)
7. Each component needs a unique id (use format: "component-type-timestamp")
8. CTA buttons should use #FAD103 background with #1a1a1a text

## USER REQUEST
{userPrompt}

## BRAND CONTEXT
Company: {companyName}
Website: {websiteUrl}

Generate the email template now. Return ONLY the JSON object, no other text.`;

/**
 * Format component schemas for the AI prompt
 */
function formatComponentSchemas(): string {
  const schemas: string[] = [];

  for (const [type, registered] of Object.entries(componentRegistry)) {
    const schema = registered.schema;
    const props = Object.entries(schema.props)
      .map(([name, prop]) => {
        let propDesc = `  - ${name} (${prop.type}): ${prop.description}`;
        if (prop.options) {
          propDesc += ` Options: ${prop.options.map((o) => o.value).join(', ')}`;
        }
        if (prop.default !== undefined) {
          propDesc += ` Default: ${JSON.stringify(prop.default)}`;
        }
        return propDesc;
      })
      .join('\n');

    schemas.push(`### ${type}\n${schema.description}\nProps:\n${props}`);
  }

  return schemas.join('\n\n');
}

/**
 * Validate generated components against schemas
 */
function validateComponents(components: unknown[]): {
  valid: boolean;
  errors: string[];
  validComponents: ComponentInstance[];
} {
  const errors: string[] = [];
  const validComponents: ComponentInstance[] = [];

  if (!Array.isArray(components)) {
    return {
      valid: false,
      errors: ['Components must be an array'],
      validComponents: [],
    };
  }

  for (let i = 0; i < components.length; i++) {
    const comp = components[i] as Record<string, unknown>;

    if (!comp.type || typeof comp.type !== 'string') {
      errors.push(`Component ${i}: missing or invalid type`);
      continue;
    }

    if (!isValidComponentType(comp.type)) {
      errors.push(`Component ${i}: unknown type "${comp.type}"`);
      continue;
    }

    if (!comp.id || typeof comp.id !== 'string') {
      // Auto-generate ID if missing
      comp.id = `${comp.type.toLowerCase()}-${Date.now()}-${i}`;
    }

    if (!comp.props || typeof comp.props !== 'object') {
      comp.props = {};
    }

    // Get default props and merge
    const registered = componentRegistry[comp.type as ComponentType];
    const mergedProps = {
      ...registered.defaultProps,
      ...(comp.props as Record<string, unknown>),
    };

    validComponents.push({
      id: comp.id as string,
      type: comp.type as ComponentType,
      props: mergedProps,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    validComponents,
  };
}

/**
 * Generate a basic fallback template
 */
function generateFallbackTemplate(
  brandContext: BrandContext,
): GeneratedTemplate {
  const timestamp = Date.now();

  return {
    suggestedSubject: 'Good morning from Wakey',
    suggestedPreviewText: 'Something worth waking up for.',
    components: [
      {
        id: `header-${timestamp}`,
        type: 'Header',
        props: {
          logoUrl: brandContext.logoUrl || 'https://www.wakey.care/logo.png',
          backgroundColor: WAKEY_COLORS.black,
        },
      },
      {
        id: `hero-${timestamp + 1}`,
        type: 'Hero',
        props: {
          headline: 'Hey there, {{firstName}}',
          subheadline: 'We have something for you.',
          imageUrl: '',
          buttonText: 'Take a look',
          buttonUrl: brandContext.websiteUrl || 'https://www.wakey.care',
          backgroundColor: WAKEY_COLORS.black,
        },
      },
      {
        id: `textblock-${timestamp + 2}`,
        type: 'TextBlock',
        props: {
          content: 'Add your message here. Keep it short. Make it count.',
          alignment: 'center',
          fontSize: 'paragraph',
        },
      },
      {
        id: `cta-${timestamp + 3}`,
        type: 'CallToAction',
        props: {
          text: 'Shop now',
          url: brandContext.websiteUrl || 'https://www.wakey.care',
          variant: 'primary',
        },
      },
      {
        id: `footer-${timestamp + 4}`,
        type: 'Footer',
        props: {
          unsubscribeUrl: '{{unsubscribeUrl}}',
          address: brandContext.address || 'Wakey Care, London, UK',
          socialLinks: [
            {platform: 'instagram', url: 'https://instagram.com/wakeycare'},
            {platform: 'tiktok', url: 'https://tiktok.com/@wakeycare'},
          ],
        },
      },
    ],
  };
}

/**
 * Generate an email template using AI
 */
export async function generateTemplate(
  apiKey: string,
  prompt: string,
  brandContext: BrandContext = {},
): Promise<GeneratedTemplate> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({model: 'gemini-2.0-flash'});

  const componentSchemas = formatComponentSchemas();

  const fullPrompt = GENERATION_PROMPT.replace(
    '{componentSchemas}',
    componentSchemas,
  )
    .replace('{userPrompt}', prompt)
    .replace('{companyName}', brandContext.companyName || 'Wakey')
    .replace(
      '{websiteUrl}',
      brandContext.websiteUrl || 'https://www.wakey.care',
    );

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{text: fullPrompt}],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    });

    const response = result.response.text();

    // Try to extract JSON from the response
    let jsonStr = response;

    // Check for JSON code block
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      // Try to find JSON object directly
      const objectMatch = response.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }
    }

    const parsed = JSON.parse(jsonStr) as {
      suggestedSubject?: string;
      suggestedPreviewText?: string;
      components?: unknown[];
    };

    if (!parsed.components || !Array.isArray(parsed.components)) {
      console.error('AI response missing components array');
      return generateFallbackTemplate(brandContext);
    }

    // Validate and fix components
    const validation = validateComponents(parsed.components);

    if (validation.validComponents.length === 0) {
      console.error('No valid components generated:', validation.errors);
      return generateFallbackTemplate(brandContext);
    }

    // Log any validation errors for debugging
    if (validation.errors.length > 0) {
      console.warn('Component validation warnings:', validation.errors);
    }

    return {
      components: validation.validComponents,
      suggestedSubject: parsed.suggestedSubject || 'Good morning from Wakey',
      suggestedPreviewText:
        parsed.suggestedPreviewText || 'Something worth waking up for.',
    };
  } catch (error) {
    console.error('Error generating template with AI:', error);
    return generateFallbackTemplate(brandContext);
  }
}

/**
 * Get the default brand context for Wakey
 */
export function getDefaultBrandContext(): BrandContext {
  return {
    companyName: 'Wakey',
    logoUrl: 'https://www.wakey.care/logo.png',
    websiteUrl: 'https://www.wakey.care',
    address: 'Wakey Care, London, UK',
  };
}
