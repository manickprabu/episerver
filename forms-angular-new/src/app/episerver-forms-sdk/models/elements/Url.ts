import type { InputElementBase, InputElementBaseProperties } from './base';

export interface Url extends InputElementBase {
  properties: UrlProperties;
}

export interface UrlProperties extends InputElementBaseProperties {
  urlValidators: string;
}
