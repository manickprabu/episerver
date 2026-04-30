import type { SelectionBase, SelectionBaseProperties } from './base';

export interface Selection extends SelectionBase {
  properties: SelectionProperties;
}

export interface SelectionProperties extends SelectionBaseProperties {
  autoComplete: string;
}
