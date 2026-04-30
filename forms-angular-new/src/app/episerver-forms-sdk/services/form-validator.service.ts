import { Injectable } from '@angular/core';

import {
  AllowedExtensionsValidatorModel,
  ElementValidationResult,
  ElementValidatorBase,
  FormElementBase,
  MaxFileSizeValidationModel,
  RegularExpressionValidatorModel,
  ValidatableElementBaseProperties,
  ValidatorType
} from '../models';
import { isFileValid, isMatchedReg, isNull, isNullOrEmpty, isNumeric } from '../utils';

@Injectable()
export class FormValidatorService {
  validateRequired(value: unknown): boolean {
    if (
      isNull(value) ||
      (typeof value === 'string' && isNullOrEmpty(value.trim())) ||
      (value instanceof Array && value.length === 0)
    ) {
      return false;
    }

    return true;
  }

  validateRegex(value: unknown, model: ElementValidatorBase['model']): boolean {
    const regexModel = model as RegularExpressionValidatorModel;
    if (isNull(regexModel?.jsPattern) || isNullOrEmpty(value as string)) {
      return true;
    }

    return isMatchedReg(String(value), regexModel.jsPattern);
  }

  validateFileExtension(value: Array<{ name: string }> | null | undefined, model: ElementValidatorBase['model']): boolean {
    if (isNullOrEmpty(value as unknown as string) || (value instanceof Array && value.length === 0)) {
      return true;
    }

    const validatorModel = model as AllowedExtensionsValidatorModel;
    const files = value ?? [];
    const acceptTypes = isNullOrEmpty(validatorModel.accept)
      ? []
      : validatorModel.accept.split(',').map((type) => type.substring(1));

    return files.every((file) => isFileValid(file.name, acceptTypes));
  }

  validateFileSize(value: Array<{ size: number }> | null | undefined, model: ElementValidatorBase['model']): boolean {
    if (isNull(value)) {
      return true;
    }

    const validatorModel = model as MaxFileSizeValidationModel;
    return (value ?? []).every((file) => file.size <= validatorModel.sizeInBytes);
  }

  validateNumeric(value: unknown): boolean {
    return isNullOrEmpty(value as string) || isNumeric(value);
  }

  validate(element: FormElementBase, value: unknown): ElementValidationResult {
    let result: ElementValidationResult = { valid: true, message: '' };
    const validatorProps = element.properties as ValidatableElementBaseProperties;

    if (isNull(validatorProps?.validators)) {
      return result;
    }

    validatorProps.validators!.every((validator) => {
      let valid = true;

      switch (validator.type) {
        case ValidatorType.CaptchaValidator:
        case ValidatorType.RequiredValidator:
          valid = this.validateRequired(value);
          break;
        case ValidatorType.RegularExpressionValidator:
        case ValidatorType.EmailValidator:
        case ValidatorType.UrlValidator:
        case ValidatorType.DateDDMMYYYYValidator:
        case ValidatorType.DateMMDDYYYYValidator:
        case ValidatorType.DateYYYYMMDDValidator:
        case ValidatorType.IntegerValidator:
        case ValidatorType.PositiveIntegerValidator:
          valid = this.validateRegex(value, validator.model);
          break;
        case ValidatorType.AllowedExtensionsValidator:
          valid = this.validateFileExtension(value as Array<{ name: string }>, validator.model);
          break;
        case ValidatorType.MaxFileSizeValidator:
          valid = this.validateFileSize(value as Array<{ size: number }>, validator.model);
          break;
        case ValidatorType.NumericValidator:
          valid = this.validateNumeric(value);
          break;
      }

      if (!valid) {
        result = { valid, message: validator.model.message };
        return false;
      }

      return true;
    });

    return result;
  }
}
