import { FormControl, FormGroup } from '@angular/forms';

import { FormSchema } from '../models/form-schema.model';
import { FormSchemaFormService } from './form-schema-form.service';
import { FormConfirmationService } from './form-confirmation.service';

describe('FormConfirmationService', () => {
  let formSchemaFormService: jasmine.SpyObj<FormSchemaFormService>;
  let service: FormConfirmationService;

  beforeEach(() => {
    formSchemaFormService = jasmine.createSpyObj<FormSchemaFormService>('FormSchemaFormService', ['buildForm']);
    service = new FormConfirmationService(formSchemaFormService);
  });

  it('returns empty string when step index is missing', () => {
    formSchemaFormService.buildForm.and.returnValue({ steps: [] } as never);

    expect(service.buildSummary({} as FormSchema, new FormGroup({}), 2)).toBe('');
  });

  it('builds summary for normal, array and file values while excluding non-data fields', () => {
    const nameField = { key: 'name', contentType: 'TextboxElementBlock', displayName: 'Name', properties: { label: 'Name' } };
    const arrayField = { key: 'tags', contentType: 'ChoiceElementBlock', displayName: 'Tags', properties: { label: 'Tags' } };
    const fileField = { key: 'files', contentType: 'FileUploadElementBlock', displayName: 'Files', properties: { label: 'Files' } };
    const hiddenField = { key: 'step', contentType: 'FormStepBlock', displayName: 'Step', properties: { label: 'Step' } };

    formSchemaFormService.buildForm.and.returnValue({
      steps: [
        {
          elements: [nameField, arrayField, fileField, hiddenField]
        }
      ]
    } as never);

    const group = new FormGroup({
      name: new FormControl('Alice'),
      tags: new FormControl(['A', 'B']),
      files: new FormControl([{ name: 'a.pdf' }, { file: new File(['x'], 'b.pdf') }]),
      step: new FormControl('ignore')
    });

    expect(service.buildSummary({} as FormSchema, group, 0)).toBe('Name: Alice\nTags: A, B\nFiles: a.pdf, b.pdf');
  });

  it('omits empty values from the summary', () => {
    const field = { key: 'empty', contentType: 'TextboxElementBlock', displayName: 'Empty', properties: { label: 'Empty' } };
    formSchemaFormService.buildForm.and.returnValue({ steps: [{ elements: [field] }] } as never);

    expect(service.buildSummary({} as FormSchema, new FormGroup({ empty: new FormControl('') }), 0)).toBe('');
  });
});
