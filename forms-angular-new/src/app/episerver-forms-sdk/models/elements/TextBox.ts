import type { InputElementBase, InputElementBaseProperties } from './base';

export interface Textbox extends InputElementBase {
  properties: TextboxProperties;
}

export interface TextboxProperties extends InputElementBaseProperties {
  autoComplete: string;
}
