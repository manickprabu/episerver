import { Injectable } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';

import { StepBuilderService } from '../../episerver-forms/sdk';
import { FormField, FormFieldOption, FormFieldValidator, FormSchema, FormStep, ValidatorType } from '../models/form-schema.model';

export interface BuiltForm {
  form: FormSchema;
  formGroup: FormGroup;
  steps: FormStep[];
  initialValue: Record<string, unknown>;
}

@Injectable()
export class FormSchemaFormService {
  constructor(private readonly stepBuilderService: StepBuilderService) {}

  buildForm(form: FormSchema): BuiltForm {
    const builtForm = (form.steps?.length ? form : this.stepBuilderService.buildForm(form)) as FormSchema;
    const controls: Record<string, FormControl> = {};
    const initialValue: Record<string, unknown> = {};

    for (const field of builtForm.formElements as FormField[]) {
      if (field.contentType === 'FormStepBlock') {
        continue;
      }

      const value = this.getInitialValue(field);
      controls[field.key] = new FormControl(value, {
        nonNullable: false,
        validators: this.buildValidators(field)
      });
      initialValue[field.key] = value;
    }

    return {
      form: builtForm,
      formGroup: new FormGroup(controls),
      steps: builtForm.steps,
      initialValue
    };
  }

  controlFor(formGroup: FormGroup, field: FormField): AbstractControl | null {
    return formGroup.get(field.key);
  }

  getInitialValue(field: FormField): unknown {
    const properties = field.properties;
    const defaultValue = properties.predefinedValue ?? (properties as unknown as Record<string, unknown>)['defaultValue'];

    switch (field.contentType) {
      case 'ChoiceElementBlock':
      case 'ImageChoiceElementBlock':
        if (properties.allowMultiSelect) {
          return this.getCheckedValues(properties.items);
        }
        return this.getCheckedValues(properties.items)[0] ?? defaultValue ?? null;
      case 'SelectionElementBlock':
        if (properties.allowMultiSelect) {
          return this.getCheckedValues(properties.items);
        }
        return defaultValue ?? '';
      case 'NumberElementBlock':
      case 'RangeElementBlock':
        return defaultValue ?? properties.min ?? 0;
      case 'FileUploadElementBlock':
        return [];
      case 'PredefinedHiddenElementBlock':
        return defaultValue ?? '';
      case 'ResetButtonElementBlock':
      case 'SubmitButtonElementBlock':
      case 'ParagraphTextElementBlock':
      case 'FormStepBlock':
        return defaultValue ?? null;
      default:
        return defaultValue ?? '';
    }
  }

  getValidationMessage(field: FormField, control: AbstractControl | null): string {
    if (!control || !control.errors) {
      return '';
    }

    const validators = field.properties.validators ?? [];

    for (const validator of validators) {
      const key = this.toAngularErrorKey(validator);
      if (key && control.hasError(key)) {
        return validator.model.message ?? 'Invalid value';
      }
    }

    if (control.hasError('server')) {
      return String(control.getError('server'));
    }
    if (control.hasError('sdk')) {
      return String(control.getError('sdk'));
    }
    if (control.hasError('required')) {
      return 'This field is required.';
    }
    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }
    if (control.hasError('pattern')) {
      return 'Enter a valid value.';
    }
    if (control.hasError('min')) {
      return 'Value is below the allowed minimum.';
    }
    if (control.hasError('max')) {
      return 'Value exceeds the allowed maximum.';
    }
    if (control.hasError('allowedExtensions')) {
      return 'The selected file type is not allowed.';
    }
    if (control.hasError('maxFileSize')) {
      return 'The selected file is too large.';
    }

    return 'Invalid value.';
  }

  private buildValidators(field: FormField): ValidatorFn[] {
    const validators: ValidatorFn[] = [];
    const fieldValidators = field.properties.validators ?? [];

    for (const validator of fieldValidators) {
      switch (validator.type) {
        case ValidatorType.RequiredValidator:
        case 'RequiredValidator':
          validators.push(Validators.required);
          break;
        case ValidatorType.EmailValidator:
        case 'EmailValidator':
          validators.push(Validators.email);
          break;
        case ValidatorType.RegularExpressionValidator:
        case ValidatorType.UrlValidator:
        case ValidatorType.IntegerValidator:
        case ValidatorType.PositiveIntegerValidator:
        case ValidatorType.NumericValidator:
        case 'RegularExpressionValidator':
        case 'UrlValidator':
        case 'IntegerValidator':
        case 'PositiveIntegerValidator':
        case 'NumericValidator': {
          const pattern = (validator.model as { jsPattern?: string }).jsPattern;
          if (pattern) {
            validators.push(Validators.pattern(pattern));
          }
          break;
        }
        case ValidatorType.MaxFileSizeValidator:
        case 'MaxFileSizeValidator': {
          const maxSize = (validator.model as { sizeInBytes?: number }).sizeInBytes;
          if (typeof maxSize === 'number') {
            validators.push(this.maxFileSizeValidator(maxSize));
          }
          break;
        }
        case ValidatorType.AllowedExtensionsValidator:
        case 'AllowedExtensionsValidator': {
          const accept = (validator.model as { accept?: string }).accept;
          if (accept) {
            validators.push(this.allowedExtensionsValidator(accept));
          }
          break;
        }
      }
    }

    if (typeof field.properties.min === 'number') {
      validators.push(Validators.min(field.properties.min));
    }
    if (typeof field.properties.max === 'number') {
      validators.push(Validators.max(field.properties.max));
    }

    return validators;
  }

  private maxFileSizeValidator(maxSize: number): ValidatorFn {
    return (control) => {
      const value = control.value as Array<{ file?: File }> | null;
      if (!Array.isArray(value) || value.length === 0) {
        return null;
      }

      const invalid = value.some((entry) => (entry.file?.size ?? 0) > maxSize);
      return invalid ? { maxFileSize: true } : null;
    };
  }

  private allowedExtensionsValidator(accept: string): ValidatorFn {
    const normalized = accept
      .split(',')
      .map((extension) => extension.toLowerCase().replace(/^\./, '').trim())
      .filter(Boolean);

    return (control) => {
      const value = control.value as Array<{ name?: string }> | null;
      if (!Array.isArray(value) || value.length === 0) {
        return null;
      }

      const invalid = value.some((entry) => {
        const name = entry.name ?? '';
        const extension = name.split('.').pop()?.toLowerCase() ?? '';
        return !normalized.includes(extension);
      });

      return invalid ? { allowedExtensions: true } : null;
    };
  }

  private toAngularErrorKey(validator: FormFieldValidator): string | null {
    switch (validator.type) {
      case ValidatorType.RequiredValidator:
      case 'RequiredValidator':
        return 'required';
      case ValidatorType.EmailValidator:
      case 'EmailValidator':
        return 'email';
      case ValidatorType.RegularExpressionValidator:
      case ValidatorType.UrlValidator:
      case ValidatorType.IntegerValidator:
      case ValidatorType.PositiveIntegerValidator:
      case ValidatorType.NumericValidator:
      case 'RegularExpressionValidator':
      case 'UrlValidator':
      case 'IntegerValidator':
      case 'PositiveIntegerValidator':
      case 'NumericValidator':
        return 'pattern';
      case ValidatorType.MaxFileSizeValidator:
      case 'MaxFileSizeValidator':
        return 'maxFileSize';
      case ValidatorType.AllowedExtensionsValidator:
      case 'AllowedExtensionsValidator':
        return 'allowedExtensions';
      default:
        return null;
    }
  }

  private getCheckedValues(items: FormFieldOption[] | undefined): string[] {
    return (items ?? []).filter((item) => item.checked && Boolean(item.value)).map((item) => item.value as string);
  }
}
