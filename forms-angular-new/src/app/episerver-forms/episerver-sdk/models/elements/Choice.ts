import type { SelectionBase, SelectionBaseProperties } from './base/SelectionBase';

export interface Choice extends SelectionBase {
  properties: ChoiceProperties;
}

export interface ChoiceProperties extends SelectionBaseProperties {
  placeHolder: string;
}
