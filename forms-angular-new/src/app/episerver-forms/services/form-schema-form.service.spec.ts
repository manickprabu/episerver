import { FormControl, FormGroup } from '@angular/forms';

import { StepBuilderService } from '../../episerver-forms/episerver-sdk';
import { FormField, FormSchema, ValidatorType } from '../models/form-schema.model';
import { FormSchemaFormService } from './form-schema-form.service';

function createField(overrides: Partial<FormField> = {}): FormField {
  const field = {
    key: 'field-key',
    contentType: 'TextboxElementBlock',
    displayName: 'Field',
    validators: [],
    properties: {
      label: 'Label',
      items: [],
      validators: []
    }
  } as unknown as FormField;

  return {
    ...field,
    ...overrides,
    properties: {
      ...field.properties,
      ...(overrides.properties ?? {})
    }
  } as FormField;
}

describe('FormSchemaFormService', () => {
  let stepBuilderService: jasmine.SpyObj<StepBuilderService>;
  let service: FormSchemaFormService;

  beforeEach(() => {
    stepBuilderService = jasmine.createSpyObj<StepBuilderService>('StepBuilderService', ['buildForm']);
    service = new FormSchemaFormService(stepBuilderService);
  });

  it('builds controls and initial values, skipping step blocks', () => {
    const textField = createField({ key: 'text', properties: { label: 'Text', validators: [] } as never });
    const stepField = createField({ key: 'step', contentType: 'FormStepBlock' });
    const builtForm = {
      formElements: [textField, stepField],
      steps: [{ formStep: stepField, elements: [textField] }]
    } as unknown as FormSchema;

    stepBuilderService.buildForm.and.returnValue(builtForm as never);

    const result = service.buildForm({ formElements: [textField, stepField], steps: [] } as unknown as FormSchema);

    expect(stepBuilderService.buildForm).toHaveBeenCalled();
    expect(Object.keys(result.formGroup.controls)).toEqual(['text']);
    expect(result.initialValue['text']).toBe('');
    expect(result.steps.length).toBe(1);
  });

  it('uses existing form steps without rebuilding when already present', () => {
    const field = createField({ key: 'existing' });
    const form = {
      formElements: [field],
      steps: [{ formStep: createField({ contentType: 'FormStepBlock' }), elements: [field] }]
    } as unknown as FormSchema;

    const result = service.buildForm(form);

    expect(stepBuilderService.buildForm).not.toHaveBeenCalled();
    expect(result.form).toBe(form);
  });

  it('resolves controls by field key', () => {
    const field = createField({ key: 'target' });
    const group = new FormGroup({ target: new FormControl('value') });

    expect(service.controlFor(group, field)?.value).toBe('value');
  });

  it('returns initial values for different field types', () => {
    expect(service.getInitialValue(createField({ contentType: 'ChoiceElementBlock', properties: { allowMultiSelect: true, items: [{ value: 'A', checked: true }], validators: [] } as never }))).toEqual(['A']);
    expect(service.getInitialValue(createField({ contentType: 'ChoiceElementBlock', properties: { items: [{ value: 'A', checked: true }], validators: [] } as never }))).toBe('A');
    expect(service.getInitialValue(createField({ contentType: 'SelectionElementBlock', properties: { allowMultiSelect: true, items: [{ value: 'A', checked: true }], validators: [] } as never }))).toEqual(['A']);
    expect(service.getInitialValue(createField({ contentType: 'SelectionElementBlock', properties: { predefinedValue: 'preset', validators: [] } as never }))).toBe('preset');
    expect(service.getInitialValue(createField({ contentType: 'NumberElementBlock', properties: { min: 5, validators: [] } as never }))).toBe(5);
    expect(service.getInitialValue(createField({ contentType: 'RangeElementBlock', properties: { validators: [] } as never }))).toBe(0);
    expect(service.getInitialValue(createField({ contentType: 'FileUploadElementBlock' }))).toEqual([]);
    expect(service.getInitialValue(createField({ contentType: 'PredefinedHiddenElementBlock', properties: { predefinedValue: 'hidden', validators: [] } as never }))).toBe('hidden');
    expect(service.getInitialValue(createField({ contentType: 'SubmitButtonElementBlock' }))).toBeNull();
    expect(service.getInitialValue(createField({ contentType: 'TextboxElementBlock', properties: { defaultValue: 'hello', validators: [] } as never }))).toBe('hello');
  });

  it('builds validation messages from validators and fallback errors', () => {
    const field = createField({
      properties: {
        label: 'Email',
        validators: [
          {
            type: ValidatorType.RequiredValidator,
            model: { message: 'Required message' }
          },
          {
            type: ValidatorType.EmailValidator,
            model: { message: 'Email message' }
          }
        ]
      } as never
    });

    const requiredControl = new FormControl('');
    requiredControl.setErrors({ required: true });
    expect(service.getValidationMessage(field, requiredControl)).toBe('Required message');

    const emailControl = new FormControl('bad');
    emailControl.setErrors({ email: true });
    expect(service.getValidationMessage(field, emailControl)).toBe('Email message');

    const serverControl = new FormControl('x');
    serverControl.setErrors({ server: 'Server error' });
    expect(service.getValidationMessage(field, serverControl)).toBe('Server error');

    const sdkControl = new FormControl('x');
    sdkControl.setErrors({ sdk: 'Sdk error' });
    expect(service.getValidationMessage(field, sdkControl)).toBe('Sdk error');

    const minControl = new FormControl(1);
    minControl.setErrors({ min: true });
    expect(service.getValidationMessage(field, minControl)).toBe('Value is below the allowed minimum.');

    const maxControl = new FormControl(99);
    maxControl.setErrors({ max: true });
    expect(service.getValidationMessage(field, maxControl)).toBe('Value exceeds the allowed maximum.');

    const extensionsControl = new FormControl('x');
    extensionsControl.setErrors({ allowedExtensions: true });
    expect(service.getValidationMessage(field, extensionsControl)).toBe('The selected file type is not allowed.');

    const fileSizeControl = new FormControl('x');
    fileSizeControl.setErrors({ maxFileSize: true });
    expect(service.getValidationMessage(field, fileSizeControl)).toBe('The selected file is too large.');

    const unknownControl = new FormControl('x');
    unknownControl.setErrors({ custom: true });
    expect(service.getValidationMessage(field, unknownControl)).toBe('Invalid value.');
    expect(service.getValidationMessage(field, null)).toBe('');
  });

  it('applies validators for required, email, pattern, min, max, file size and extensions', () => {
    const field = createField({
      key: 'validated',
      contentType: 'TextboxElementBlock',
      properties: {
        label: 'Validated',
        min: 2,
        max: 5,
        validators: [
          { type: ValidatorType.RequiredValidator, model: { message: 'Required' } },
          { type: ValidatorType.EmailValidator, model: { message: 'Email' } },
          { type: ValidatorType.RegularExpressionValidator, model: { jsPattern: '^ok$' } },
          { type: ValidatorType.MaxFileSizeValidator, model: { sizeInBytes: 5 } },
          { type: ValidatorType.AllowedExtensionsValidator, model: { accept: '.pdf,.docx' } }
        ]
      } as never
    });

    stepBuilderService.buildForm.and.returnValue({ formElements: [field], steps: [] } as never);
    const result = service.buildForm({ formElements: [field], steps: [] } as unknown as FormSchema);
    const control = result.formGroup.get('validated') as FormControl;

    control.setValue('');
    expect(control.hasError('required')).toBeTrue();

    control.setValue('wrong');
    expect(control.hasError('email')).toBeTrue();
    expect(control.hasError('pattern')).toBeTrue();

    control.setValue(1 as never);
    expect(control.hasError('min')).toBeTrue();

    control.setValue(6 as never);
    expect(control.hasError('max')).toBeTrue();

    control.setValue([{ name: 'file.exe', file: new File(['123456'], 'file.exe') }] as never);
    expect(control.hasError('maxFileSize')).toBeTrue();
    expect(control.hasError('allowedExtensions')).toBeTrue();

    control.setValue([{ name: 'file.pdf', file: new File(['1234'], 'file.pdf') }] as never);
    expect(control.hasError('maxFileSize')).toBeFalse();
    expect(control.hasError('allowedExtensions')).toBeFalse();
  });
});
