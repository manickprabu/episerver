import { Injectable } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { FormField, FormFieldOption, FormFieldValidator, FormSchema, FormStep } from '../models/form-schema.model';

export interface BuiltForm {
  formGroup: FormGroup;
  steps: FormStep[];
  initialValue: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root'
})
export class FormSchemaFormService {
  buildForm(form: FormSchema): BuiltForm {
    const steps = this.buildSteps(form);
    const controls: Record<string, FormControl> = {};
    const initialValue: Record<string, unknown> = {};

    for (const field of form.formElements) {
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
      formGroup: new FormGroup(controls),
      steps,
      initialValue
    };
  }

  buildSteps(form: FormSchema): FormStep[] {
    const steps: FormStep[] = [];
    let elements: FormField[] = [];
    let currentStep: FormField = {
      key: `${form.key}-step-0`,
      contentType: 'FormStepBlock',
      properties: { label: form.properties.title }
    };

    form.formElements.forEach((field, index) => {
      if (field.contentType === 'FormStepBlock') {
        if (index !== 0) {
          steps.push({ formStep: { ...currentStep }, elements: [...elements] });
        }
        elements = [];
        currentStep = { ...field };
      }
      elements.push(field);
    });

    steps.push({ formStep: { ...currentStep }, elements: [...elements] });
    return steps;
  }

  getInitialValue(field: FormField): unknown {
    const defaultValue = field.properties.defaultValue;

    switch (field.contentType) {
      case 'ChoiceElementBlock':
      case 'ImageChoiceElementBlock':
        if (field.properties.allowMultiSelect) {
          return this.getCheckedValues(field.properties.items);
        }
        return this.getCheckedValues(field.properties.items)[0] ?? defaultValue ?? null;
      case 'SelectionElementBlock':
        if (field.properties.allowMultiSelect) {
          return this.getCheckedValues(field.properties.items);
        }
        return defaultValue ?? '';
      case 'NumberElementBlock':
      case 'RangeElementBlock':
        return defaultValue ?? field.properties.min ?? 0;
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

  controlFor(formGroup: FormGroup, field: FormField): AbstractControl | null {
    return formGroup.get(field.key);
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

    return 'Invalid value.';
  }

  private buildValidators(field: FormField): ValidatorFn[] {
    const validators: ValidatorFn[] = [];
    const fieldValidators = field.properties.validators ?? [];

    for (const validator of fieldValidators) {
      switch (validator.type) {
        case 'RequiredValidator':
          validators.push(Validators.required);
          break;
        case 'EmailValidator':
          validators.push(Validators.email);
          break;
        case 'RegularExpressionValidator':
        case 'UrlValidator':
        case 'IntegerValidator':
        case 'PositiveIntegerValidator':
        case 'NumericValidator':
          if (validator.model.pattern) {
            validators.push(Validators.pattern(validator.model.pattern));
          }
          break;
        case 'MaxFileSizeValidator':
          if (typeof validator.model.maxSize === 'number') {
            validators.push(this.maxFileSizeValidator(validator.model.maxSize));
          }
          break;
        case 'AllowedExtensionsValidator':
          if (validator.model.allowedExtensions?.length) {
            validators.push(this.allowedExtensionsValidator(validator.model.allowedExtensions));
          }
          break;
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

  private allowedExtensionsValidator(allowedExtensions: string[]): ValidatorFn {
    const normalized = allowedExtensions.map((extension) => extension.toLowerCase().replace(/^\./, ''));
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
      case 'RequiredValidator':
        return 'required';
      case 'EmailValidator':
        return 'email';
      case 'RegularExpressionValidator':
      case 'UrlValidator':
      case 'IntegerValidator':
      case 'PositiveIntegerValidator':
      case 'NumericValidator':
        return 'pattern';
      case 'MaxFileSizeValidator':
        return 'maxFileSize';
      case 'AllowedExtensionsValidator':
        return 'allowedExtensions';
      default:
        return null;
    }
  }

  private getCheckedValues(items: FormFieldOption[] | undefined): string[] {
    return (items ?? []).filter((item) => item.checked && !!item.value).map((item) => item.value as string);
  }
}
