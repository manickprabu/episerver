import type { ElementValidatorBase } from './base';

export interface NumericValidator extends ElementValidatorBase {
  isValidNumber: boolean;
}
