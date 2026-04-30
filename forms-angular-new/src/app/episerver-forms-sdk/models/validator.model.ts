import { ValidatorType } from './validator-type.enum';

export interface ElementValidatorModelBase {
  message: string;
  validationCssClass: string;
  additionalAttributes: unknown;
}

export interface RegularExpressionValidatorModel extends ElementValidatorModelBase {
  jsPattern: string;
  dotNetPattern: string;
}

export interface AllowedExtensionsValidatorModel extends ElementValidatorModelBase {
  accept: string;
}

export interface MaxFileSizeValidationModel extends ElementValidatorModelBase {
  sizeInBytes: number;
}

export interface ElementValidatorBase {
  type: ValidatorType | string;
  validationOrder: number;
  description: string;
  model: ElementValidatorModelBase;
}
