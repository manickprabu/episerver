import type { ConditionProperties } from '../form-element.model';
import type { FormElementBase, FormElementPropertiesBase } from './base/FormElementBase';

export interface ParagraphText extends FormElementBase {
  properties: ParagraphTextProperties;
}

export interface ParagraphTextProperties extends FormElementPropertiesBase, ConditionProperties {
  paragraphText: string;
  disablePlaceholdersReplacement: boolean;
}
