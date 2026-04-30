import type { InputElementBase, InputElementBaseProperties } from './base';

export interface Number extends InputElementBase {
  properties: NumberProperties;
}

export interface NumberProperties extends InputElementBaseProperties {
  autoComplete: string;
}
