import type { FormElementBase, FormElementPropertiesBase } from '../form-element.model';

export interface DependField {
  key: string;
  locale: string;
  version: number;
}

export interface FormStep extends FormElementBase {
  properties: FormStepProperties;
}

export interface FormStepProperties extends FormElementPropertiesBase {
  attachedContentLink: string;
  dependField: DependField;
  dependCondition: string;
  dependValue: string;
}
