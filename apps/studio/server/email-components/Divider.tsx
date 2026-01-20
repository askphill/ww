import {Hr, Section} from '@react-email/components';

export interface DividerProps {
  color?: string;
  spacing?: 'small' | 'medium' | 'large';
}

const SPACING_MAP = {
  small: '8px',
  medium: '16px',
  large: '32px',
} as const;

export function Divider({color = '#e0e0e0', spacing = 'medium'}: DividerProps) {
  const padding = SPACING_MAP[spacing];

  return (
    <Section
      style={{
        padding: `${padding} 0`,
      }}
    >
      <Hr
        style={{
          borderColor: color,
          borderTop: `1px solid ${color}`,
          borderBottom: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          margin: 0,
        }}
      />
    </Section>
  );
}

// Schema for the template editor
export const DividerSchema = {
  type: 'Divider',
  name: 'Divider',
  description: 'Horizontal line for visual separation between sections',
  props: {
    color: {
      type: 'color',
      label: 'Line Color',
      description: 'Color of the divider line',
      required: false,
      default: '#e0e0e0',
    },
    spacing: {
      type: 'select',
      label: 'Spacing',
      description: 'Vertical padding around the divider',
      required: false,
      default: 'medium',
      options: [
        {value: 'small', label: 'Small (8px)'},
        {value: 'medium', label: 'Medium (16px)'},
        {value: 'large', label: 'Large (32px)'},
      ],
    },
  },
} as const;

export const DividerDefaultProps: DividerProps = {
  color: '#e0e0e0',
  spacing: 'medium',
};
