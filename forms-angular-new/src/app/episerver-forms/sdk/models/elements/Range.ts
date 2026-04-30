import type { InputElementBase, InputElementBaseProperties } from './base';

export interface Range extends InputElementBase {
  properties: RangeProperties;
}

export interface RangeProperties extends InputElementBaseProperties {
  min: number;
  max: number;
  step: number;
  predefinedValue: string;
}
