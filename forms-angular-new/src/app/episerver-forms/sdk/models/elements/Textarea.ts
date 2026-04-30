import type { InputElementBase, InputElementBaseProperties } from './base';

export interface Textarea extends InputElementBase {
  properties: TextareaProperties;
}

export interface TextareaProperties extends InputElementBaseProperties {
  autoComplete: string;
}
