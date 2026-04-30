import type { FormElementBase, FormElementPropertiesBase } from '../../form-element.model';

export interface ButtonBase extends FormElementBase {
  properties: ButtonBaseProperties;
}

export interface ButtonBaseProperties extends FormElementPropertiesBase {}
