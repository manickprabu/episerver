import type { AllowedExtensionsValidatorModel } from '../validator.model';
import type { InternalElementValidatorBase } from './base';

export interface AllowedExtensionsValidator extends InternalElementValidatorBase {
  model: AllowedExtensionsValidatorModel;
}

export type { AllowedExtensionsValidatorModel };
