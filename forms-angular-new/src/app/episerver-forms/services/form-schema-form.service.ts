import { Injectable } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';

import { StepBuilderService } from '../../episerver-forms/episerver-sdk';
import { FormField, FormFieldOption, FormFieldValidator, FormSchema, FormStep, FormUploadedFile, ValidatorType } from '../models/form-schema.model';

const DEFAULT_MAX_UPLOAD_FILES = 5;
const DEFAULT_MAX_UPLOAD_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const DEFAULT_UPLOAD_FILE_TYPES = '.pdf,.doc,.txt';

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
      controls[field.key] = new FormControl(
        {
          value,
          disabled: Boolean(field.properties.disabled)
        },
        {
          nonNullable: false,
          validators: this.buildValidators(field)
        }
      );
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
        return this.normalizeUploadedFiles(defaultValue);
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
    if (control.hasError('maxFileCount')) {
      const maxFiles = this.resolveMaxUploadFiles(field);
      return maxFiles === 1 ? 'You can upload 1 file only.' : `You can upload up to ${maxFiles} files.`;
    }
    if (control.hasError('maxFileSize')) {
      return `Each file must be ${this.maxUploadFileSizeLabel(field)} or smaller.`;
    }

    return 'Invalid value.';
  }

  private buildValidators(field: FormField): ValidatorFn[] {
    const validators: ValidatorFn[] = [];
    const fieldValidators = field.properties.validators ?? [];
    let configuredMaxFileSize: number | null = null;

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
            configuredMaxFileSize = configuredMaxFileSize === null ? maxSize : Math.min(configuredMaxFileSize, maxSize);
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
    if (field.contentType === 'FileUploadElementBlock') {
      validators.push(this.maxFileCountValidator(this.resolveMaxUploadFiles(field)));
      validators.push(
        this.maxFileSizeValidator(
          configuredMaxFileSize === null
            ? this.resolveMaxUploadFileSizeBytes(field)
            : Math.min(configuredMaxFileSize, this.resolveMaxUploadFileSizeBytes(field))
        )
      );
      const uploadFileTypes = this.resolveUploadFileTypes(field);
      if (uploadFileTypes) {
        validators.push(this.allowedExtensionsValidator(uploadFileTypes));
      }
    }

    return validators;
  }

  private maxFileCountValidator(maxFiles: number): ValidatorFn {
    return control => {
      const value = control.value as FormUploadedFile[] | null;
      if (!Array.isArray(value) || value.length <= maxFiles) {
        return null;
      }

      return { maxFileCount: true };
    };
  }

  private maxFileSizeValidator(maxSize: number): ValidatorFn {
    return control => {
      const value = control.value as FormUploadedFile[] | null;
      if (!Array.isArray(value) || value.length === 0) {
        return null;
      }

      const invalid = value.some(entry => this.fileSize(entry) > maxSize);
      return invalid ? { maxFileSize: true } : null;
    };
  }

  private allowedExtensionsValidator(accept: string): ValidatorFn {
    const normalized = accept
      .split(',')
      .map(extension => extension.toLowerCase().replace(/^\./, '').trim())
      .filter(Boolean);

    return control => {
      const value = control.value as FormUploadedFile[] | null;
      if (!Array.isArray(value) || value.length === 0) {
        return null;
      }

      const invalid = value.some(entry => {
        const name = entry.name ?? '';
        const extension = name.split('.').pop()?.toLowerCase() ?? '';
        return !normalized.includes(extension);
      });

      return invalid ? { allowedExtensions: true } : null;
    };
  }

  private resolveMaxUploadFiles(field: FormField): number {
    return field.properties.allowMultiple === false ? 1 : DEFAULT_MAX_UPLOAD_FILES;
  }

  private resolveMaxUploadFileSizeBytes(field: FormField): number {
    if (typeof field.properties.fileSize === 'number' && Number.isFinite(field.properties.fileSize) && field.properties.fileSize > 0) {
      return field.properties.fileSize * 1024 * 1024;
    }

    return DEFAULT_MAX_UPLOAD_FILE_SIZE_BYTES;
  }

  private resolveUploadFileTypes(field: FormField): string {
    return typeof field.properties.fileTypes === 'string' && field.properties.fileTypes.trim() ? field.properties.fileTypes : DEFAULT_UPLOAD_FILE_TYPES;
  }

  private maxUploadFileSizeLabel(field: FormField): string {
    const sizeInMb = this.resolveMaxUploadFileSizeBytes(field) / (1024 * 1024);
    return Number.isInteger(sizeInMb) ? `${sizeInMb}MB` : `${sizeInMb.toFixed(1)}MB`;
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
    return (items ?? []).filter(item => item.checked && Boolean(item.value)).map(item => item.value as string);
  }

  private normalizeUploadedFiles(value: unknown): FormUploadedFile[] {
    if (Array.isArray(value)) {
      return value
        .map(entry => this.normalizeUploadedFile(entry))
        .filter((entry): entry is FormUploadedFile => entry !== null);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return [];
      }

      try {
        return this.normalizeUploadedFiles(JSON.parse(trimmed));
      } catch {
        return [];
      }
    }

    return [];
  }

  private normalizeUploadedFile(value: unknown): FormUploadedFile | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const file = value as Record<string, unknown>;
    const name = this.readString(file, ['name', 'Name', 'fileName', 'FileName']);
    const url = this.readString(file, ['url', 'Url', 'downloadUrl', 'DownloadUrl', 'value', 'Value']);
    const assetGuid = this.readString(file, ['assetGuid', 'AssetGuid']);
    const size = this.readNumber(file, ['size', 'Size']);
    const browserFile = file['file'] instanceof File ? file['file'] : undefined;

    if (!name && !url && !browserFile) {
      return null;
    }

    return {
      name: name ?? browserFile?.name ?? url?.split('/').pop() ?? 'File',
      size: size ?? browserFile?.size ?? undefined,
      url: url ?? undefined,
      assetGuid: assetGuid ?? undefined,
      file: browserFile
    };
  }

  private fileSize(file: FormUploadedFile): number {
    return typeof file.size === 'number' ? file.size : (file.file?.size ?? 0);
  }

  private readString(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return null;
  }

  private readNumber(source: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
    }

    return null;
  }
}
