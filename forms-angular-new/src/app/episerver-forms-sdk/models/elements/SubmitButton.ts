import type { ConditionProperties } from '../form-element.model';
import type { ButtonBase, ButtonBaseProperties } from './base/ButtonBase';

export interface SubmitButton extends ButtonBase {
  properties: SubmitButtonProperties;
}

export interface SubmitButtonProperties extends ButtonBaseProperties, ConditionProperties {
  finalizeForm: boolean;
  image: string;
  redirectToPage: string;
}
