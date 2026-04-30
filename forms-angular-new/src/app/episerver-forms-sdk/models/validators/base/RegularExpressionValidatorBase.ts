import type { ElementValidatorBase, ElementValidatorModelBase, RegularExpressionValidatorModel } from '../../validator.model';

export interface RegularExpressionValidatorBase extends ElementValidatorBase {
  model: RegularExpressionValidatorModel;
}

export type { RegularExpressionValidatorModel, ElementValidatorModelBase };
