import {useReducer, useCallback} from 'react';
import type {EmailSection, SectionType} from '@wakey/email';
import {
  defaultHeaderConfig,
  defaultHeroConfig,
  defaultImageConfig,
  defaultProductGridConfig,
  defaultTextBlockConfig,
  defaultImageTextSplitConfig,
  defaultCtaButtonConfig,
  defaultFooterConfig,
} from '@wakey/email';

interface EmailBuilderState {
  sections: EmailSection[];
  selectedSectionId: string | null;
  templateName: string;
  templateDescription: string;
  isDirty: boolean;
}

type EmailBuilderAction =
  | {type: 'SET_SECTIONS'; sections: EmailSection[]}
  | {type: 'ADD_SECTION'; sectionType: SectionType; index?: number}
  | {type: 'REMOVE_SECTION'; id: string}
  | {type: 'MOVE_SECTION'; fromIndex: number; toIndex: number}
  | {
      type: 'UPDATE_SECTION';
      id: string;
      config: Partial<EmailSection['config']>;
    }
  | {type: 'SELECT_SECTION'; id: string | null}
  | {type: 'SET_TEMPLATE_NAME'; name: string}
  | {type: 'SET_TEMPLATE_DESCRIPTION'; description: string}
  | {type: 'MARK_SAVED'};

function generateId(): string {
  return `section_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getDefaultConfig(type: SectionType): EmailSection['config'] {
  switch (type) {
    case 'header':
      return defaultHeaderConfig;
    case 'hero':
      return defaultHeroConfig;
    case 'image':
      return defaultImageConfig;
    case 'product_grid':
      return defaultProductGridConfig;
    case 'text_block':
      return defaultTextBlockConfig;
    case 'image_text_split':
      return defaultImageTextSplitConfig;
    case 'cta_button':
      return defaultCtaButtonConfig;
    case 'footer':
      return defaultFooterConfig;
  }
}

function createSection(type: SectionType): EmailSection {
  return {
    id: generateId(),
    type,
    config: getDefaultConfig(type),
  } as EmailSection;
}

function reducer(
  state: EmailBuilderState,
  action: EmailBuilderAction,
): EmailBuilderState {
  switch (action.type) {
    case 'SET_SECTIONS':
      return {...state, sections: action.sections, isDirty: false};

    case 'ADD_SECTION': {
      const newSection = createSection(action.sectionType);
      const index = action.index ?? state.sections.length;
      const sections = [...state.sections];
      sections.splice(index, 0, newSection);
      return {
        ...state,
        sections,
        selectedSectionId: newSection.id,
        isDirty: true,
      };
    }

    case 'REMOVE_SECTION': {
      const sections = state.sections.filter((s) => s.id !== action.id);
      return {
        ...state,
        sections,
        selectedSectionId:
          state.selectedSectionId === action.id
            ? null
            : state.selectedSectionId,
        isDirty: true,
      };
    }

    case 'MOVE_SECTION': {
      const sections = [...state.sections];
      const [removed] = sections.splice(action.fromIndex, 1);
      if (removed) {
        sections.splice(action.toIndex, 0, removed);
      }
      return {...state, sections, isDirty: true};
    }

    case 'UPDATE_SECTION': {
      const sections = state.sections.map((section) => {
        if (section.id !== action.id) return section;
        return {
          ...section,
          config: {...section.config, ...action.config},
        } as EmailSection;
      });
      return {...state, sections, isDirty: true};
    }

    case 'SELECT_SECTION':
      return {...state, selectedSectionId: action.id};

    case 'SET_TEMPLATE_NAME':
      return {...state, templateName: action.name, isDirty: true};

    case 'SET_TEMPLATE_DESCRIPTION':
      return {...state, templateDescription: action.description, isDirty: true};

    case 'MARK_SAVED':
      return {...state, isDirty: false};

    default:
      return state;
  }
}

const initialState: EmailBuilderState = {
  sections: [],
  selectedSectionId: null,
  templateName: 'Untitled Template',
  templateDescription: '',
  isDirty: false,
};

export function useEmailBuilder() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addSection = useCallback((type: SectionType, index?: number) => {
    dispatch({type: 'ADD_SECTION', sectionType: type, index});
  }, []);

  const removeSection = useCallback((id: string) => {
    dispatch({type: 'REMOVE_SECTION', id});
  }, []);

  const moveSection = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({type: 'MOVE_SECTION', fromIndex, toIndex});
  }, []);

  const updateSection = useCallback(
    (id: string, config: Partial<EmailSection['config']>) => {
      dispatch({type: 'UPDATE_SECTION', id, config});
    },
    [],
  );

  const selectSection = useCallback((id: string | null) => {
    dispatch({type: 'SELECT_SECTION', id});
  }, []);

  const setTemplateName = useCallback((name: string) => {
    dispatch({type: 'SET_TEMPLATE_NAME', name});
  }, []);

  const setTemplateDescription = useCallback((description: string) => {
    dispatch({type: 'SET_TEMPLATE_DESCRIPTION', description});
  }, []);

  const setSections = useCallback((sections: EmailSection[]) => {
    dispatch({type: 'SET_SECTIONS', sections});
  }, []);

  const markSaved = useCallback(() => {
    dispatch({type: 'MARK_SAVED'});
  }, []);

  const selectedSection = state.selectedSectionId
    ? state.sections.find((s) => s.id === state.selectedSectionId)
    : null;

  return {
    sections: state.sections,
    selectedSectionId: state.selectedSectionId,
    selectedSection,
    templateName: state.templateName,
    templateDescription: state.templateDescription,
    isDirty: state.isDirty,
    addSection,
    removeSection,
    moveSection,
    updateSection,
    selectSection,
    setTemplateName,
    setTemplateDescription,
    setSections,
    markSaved,
  };
}
