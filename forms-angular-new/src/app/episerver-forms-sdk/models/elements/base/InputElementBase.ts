import type { ConditionProperties, DataElementBlockBaseProperties } from '../../form-element.model';
import type { ValidatableElementBase } from './ValidatableElementBase';

export interface InputElementBase extends ValidatableElementBase {
  properties: InputElementBaseProperties;
}

export interface InputElementBaseProperties extends DataElementBlockBaseProperties, ConditionProperties {
  placeHolder: string;
}
