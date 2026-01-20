/**
 * Email Components Registry
 *
 * Central registry for all email components with their schemas and default props.
 * This allows dynamic loading of components for the template editor.
 */

import {Header, HeaderSchema, HeaderDefaultProps, HeaderProps} from './Header';
import {Hero, HeroSchema, HeroDefaultProps, HeroProps} from './Hero';
import {
  TextBlock,
  TextBlockSchema,
  TextBlockDefaultProps,
  TextBlockProps,
} from './TextBlock';
import {
  CallToAction,
  CallToActionSchema,
  CallToActionDefaultProps,
  CallToActionProps,
} from './CallToAction';
import {
  ProductGrid,
  ProductGridSchema,
  ProductGridDefaultProps,
  ProductGridProps,
} from './ProductGrid';
import {Footer, FooterSchema, FooterDefaultProps, FooterProps} from './Footer';
import {
  Divider,
  DividerSchema,
  DividerDefaultProps,
  DividerProps,
} from './Divider';

// Re-export all components and their types
export {Header, HeaderSchema, HeaderDefaultProps};
export type {HeaderProps};

export {Hero, HeroSchema, HeroDefaultProps};
export type {HeroProps};

export {TextBlock, TextBlockSchema, TextBlockDefaultProps};
export type {TextBlockProps};

export {CallToAction, CallToActionSchema, CallToActionDefaultProps};
export type {CallToActionProps};

export {ProductGrid, ProductGridSchema, ProductGridDefaultProps};
export type {ProductGridProps};

export {Footer, FooterSchema, FooterDefaultProps};
export type {FooterProps};

export {Divider, DividerSchema, DividerDefaultProps};
export type {DividerProps};

// Component registry type definitions
export type ComponentType =
  | 'Header'
  | 'Hero'
  | 'TextBlock'
  | 'CallToAction'
  | 'ProductGrid'
  | 'Footer'
  | 'Divider';

export type ComponentProps =
  | HeaderProps
  | HeroProps
  | TextBlockProps
  | CallToActionProps
  | ProductGridProps
  | FooterProps
  | DividerProps;

export interface ComponentInstance {
  id: string;
  type: ComponentType;
  props: Record<string, unknown>;
}

export interface ComponentSchema {
  type: string;
  name: string;
  description: string;
  props: Record<
    string,
    {
      type: string;
      label: string;
      description: string;
      required: boolean;
      default?: unknown;
      options?: Array<{value: string | number; label: string}>;
      itemSchema?: Record<string, unknown>;
      maxItems?: number;
    }
  >;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = React.ComponentType<any>;

export interface RegisteredComponent {
  component: AnyComponent;
  schema: ComponentSchema;
  defaultProps: Record<string, unknown>;
}

// Component registry - maps component types to their implementations
export const componentRegistry: Record<ComponentType, RegisteredComponent> = {
  Header: {
    component: Header,
    schema: HeaderSchema as unknown as ComponentSchema,
    defaultProps: HeaderDefaultProps as unknown as Record<string, unknown>,
  },
  Hero: {
    component: Hero,
    schema: HeroSchema as unknown as ComponentSchema,
    defaultProps: HeroDefaultProps as unknown as Record<string, unknown>,
  },
  TextBlock: {
    component: TextBlock,
    schema: TextBlockSchema as unknown as ComponentSchema,
    defaultProps: TextBlockDefaultProps as unknown as Record<string, unknown>,
  },
  CallToAction: {
    component: CallToAction,
    schema: CallToActionSchema as unknown as ComponentSchema,
    defaultProps: CallToActionDefaultProps as unknown as Record<
      string,
      unknown
    >,
  },
  ProductGrid: {
    component: ProductGrid,
    schema: ProductGridSchema as unknown as ComponentSchema,
    defaultProps: ProductGridDefaultProps as unknown as Record<string, unknown>,
  },
  Footer: {
    component: Footer,
    schema: FooterSchema as unknown as ComponentSchema,
    defaultProps: FooterDefaultProps as unknown as Record<string, unknown>,
  },
  Divider: {
    component: Divider,
    schema: DividerSchema as unknown as ComponentSchema,
    defaultProps: DividerDefaultProps as unknown as Record<string, unknown>,
  },
};

// Get all component types
export function getComponentTypes(): ComponentType[] {
  return Object.keys(componentRegistry) as ComponentType[];
}

// Get a component by type
export function getComponent(
  type: ComponentType,
): RegisteredComponent | undefined {
  return componentRegistry[type];
}

// Get all component schemas (useful for editor)
export function getAllSchemas(): Record<ComponentType, ComponentSchema> {
  const schemas: Partial<Record<ComponentType, ComponentSchema>> = {};
  for (const [type, registered] of Object.entries(componentRegistry)) {
    schemas[type as ComponentType] = registered.schema;
  }
  return schemas as Record<ComponentType, ComponentSchema>;
}

// Check if a type is a valid component type
export function isValidComponentType(type: string): type is ComponentType {
  return type in componentRegistry;
}
