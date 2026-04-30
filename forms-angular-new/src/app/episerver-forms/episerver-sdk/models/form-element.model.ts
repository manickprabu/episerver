import { ElementValidatorBase } from './validator.model';
import { RuleConditionProperties } from './conditions.model';

export interface FormElementPropertiesBase {
  description: string;
  label: string;
}

export interface DependFieldReference {
  key?: string;
}

export interface ConditionProperties {
  satisfiedAction?: string;
  attachedContentLink?: string;
  dependField?: DependFieldReference;
}

export interface ValidatableElementBaseProperties extends FormElementPropertiesBase {
  validators?: ElementValidatorBase[];
  validatorMessages?: string;
}

export interface DataElementBlockBaseProperties extends ValidatableElementBaseProperties {
  predefinedValue?: string;
  forms_ExternalSystemsFieldMappings?: string[];
}

export interface FeedItem {
  caption: string;
  value: string;
  checked: boolean;
}

export interface SelectionProperties extends DataElementBlockBaseProperties, ConditionProperties {
  allowMultiSelect?: boolean;
  feed?: string;
  items?: FeedItem[];
}

export interface RangeProperties extends DataElementBlockBaseProperties {
  min?: number;
  max?: number;
}

export type AnyFormElementProperties = FormElementPropertiesBase &
  Partial<
    DataElementBlockBaseProperties &
      SelectionProperties &
      RangeProperties &
      ConditionProperties &
      RuleConditionProperties
  >;

export interface FormElementBase {
  key: string;
  contentType: string;
  displayName: string;
  properties: AnyFormElementProperties;
  localizations: Record<string, string>;
  locale: string;
}
