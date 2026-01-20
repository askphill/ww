/**
 * Email Renderer Service
 *
 * Renders email templates to HTML using @react-email/render.
 * Handles variable interpolation and component composition.
 */

import {render} from '@react-email/render';
import {drizzle} from 'drizzle-orm/d1';
import {eq} from 'drizzle-orm';
import {Html, Body, Container, Head, Preview} from '@react-email/components';
import * as React from 'react';
import type {D1Database} from '@cloudflare/workers-types';
import {emailTemplates} from '../db/schema';
import {
  componentRegistry,
  isValidComponentType,
  type ComponentInstance,
  type ComponentType,
} from '../email-components';

// Default sample variables for preview
const DEFAULT_VARIABLES: Record<string, string> = {
  firstName: 'Friend',
  lastName: '',
  email: 'subscriber@example.com',
  unsubscribeUrl: '#',
};

/**
 * Interpolate variables into a string value
 * Replaces {{variableName}} with the corresponding value
 */
function interpolateString(
  value: string,
  variables: Record<string, string>,
): string {
  return value.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : '';
  });
}

/**
 * Recursively interpolate variables in component props
 */
function interpolateProps(
  props: Record<string, unknown>,
  variables: Record<string, string>,
): Record<string, unknown> {
  const interpolated: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string') {
      interpolated[key] = interpolateString(value, variables);
    } else if (Array.isArray(value)) {
      interpolated[key] = value.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return interpolateProps(item as Record<string, unknown>, variables);
        }
        if (typeof item === 'string') {
          return interpolateString(item, variables);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      interpolated[key] = interpolateProps(
        value as Record<string, unknown>,
        variables,
      );
    } else {
      interpolated[key] = value;
    }
  }

  return interpolated;
}

/**
 * Create a React element for a component instance
 */
function createComponentElement(
  instance: ComponentInstance,
  variables: Record<string, string>,
): React.ReactElement | null {
  if (!isValidComponentType(instance.type)) {
    console.warn(`Unknown component type: ${instance.type}`);
    return null;
  }

  const registered = componentRegistry[instance.type as ComponentType];
  if (!registered) {
    return null;
  }

  // Merge default props with instance props and interpolate variables
  const mergedProps = {...registered.defaultProps, ...instance.props};
  const interpolatedProps = interpolateProps(mergedProps, variables);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return React.createElement(registered.component, {
    key: instance.id,
    ...interpolatedProps,
  } as any);
}

/**
 * Build the complete email React tree from component instances
 */
function buildEmailTree(
  components: ComponentInstance[],
  variables: Record<string, string>,
  previewText?: string,
): React.ReactElement {
  const elements = components
    .map((instance) => createComponentElement(instance, variables))
    .filter((el): el is React.ReactElement => el !== null);

  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    previewText ? React.createElement(Preview, null, previewText) : null,
    React.createElement(
      Body,
      {
        style: {
          backgroundColor: '#ffffff',
          fontFamily: "'ITC Avant Garde Gothic', Arial, Helvetica, sans-serif",
          margin: 0,
          padding: 0,
        },
      },
      React.createElement(
        Container,
        {
          style: {
            maxWidth: '600px',
            margin: '0 auto',
          },
        },
        ...elements,
      ),
    ),
  );
}

export interface RenderResult {
  html: string;
  text: string;
}

/**
 * Render a template by ID with optional variable overrides
 */
export async function renderTemplate(
  db: D1Database,
  templateId: number,
  variables?: Record<string, string>,
): Promise<RenderResult> {
  const drizzleDb = drizzle(db);

  // Fetch the template
  const template = await drizzleDb
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.id, templateId))
    .get();

  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // Parse components JSON
  let components: ComponentInstance[] = [];
  if (template.components) {
    try {
      components = JSON.parse(template.components) as ComponentInstance[];
    } catch {
      console.error('Failed to parse template components JSON');
      components = [];
    }
  }

  // Merge default variables with provided variables
  const mergedVariables = {
    ...DEFAULT_VARIABLES,
    ...variables,
  };

  // Build and render the email
  const emailTree = buildEmailTree(
    components,
    mergedVariables,
    template.previewText || undefined,
  );

  const html = await render(emailTree);
  const text = await render(emailTree, {plainText: true});

  return {html, text};
}

/**
 * Render components directly (for preview without saving to DB)
 */
export async function renderComponents(
  components: ComponentInstance[],
  variables?: Record<string, string>,
  previewText?: string,
): Promise<RenderResult> {
  const mergedVariables = {
    ...DEFAULT_VARIABLES,
    ...variables,
  };

  const emailTree = buildEmailTree(components, mergedVariables, previewText);

  const html = await render(emailTree);
  const text = await render(emailTree, {plainText: true});

  return {html, text};
}

/**
 * Get default sample variables for preview
 */
export function getDefaultVariables(): Record<string, string> {
  return {...DEFAULT_VARIABLES};
}
