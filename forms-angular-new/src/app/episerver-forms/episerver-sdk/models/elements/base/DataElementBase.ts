import type { DataElementBlockBaseProperties } from '../../form-element.model';
import type { ValidatableElementBase } from './ValidatableElementBase';

export interface DataElementBlockBase extends ValidatableElementBase {
  properties: DataElementBlockBaseProperties;
}

export type { DataElementBlockBaseProperties };
