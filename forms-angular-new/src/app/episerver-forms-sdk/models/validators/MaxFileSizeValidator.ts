import type { MaxFileSizeValidationModel } from '../validator.model';
import type { InternalElementValidatorBase } from './base';

export interface MaxFileSizeValidator extends InternalElementValidatorBase {
  model: MaxFileSizeValidationModel;
}

export type { MaxFileSizeValidationModel };
