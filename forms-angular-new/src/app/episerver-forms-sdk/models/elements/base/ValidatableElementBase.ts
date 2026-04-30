import type { FormElementBase, FormElementPropertiesBase, ValidatableElementBaseProperties } from '../../form-element.model';

export interface ValidatableElementBase extends FormElementBase {
  properties: ValidatableElementBaseProperties;
}

export type { ValidatableElementBaseProperties, FormElementPropertiesBase };
