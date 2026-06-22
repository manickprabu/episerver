import { ConditionCombinationType, ConditionFunctionType, SatisfiedActionType } from '../episerver-sdk';
import { EpiserverFormDefinition } from '../models/episerver-form-definition.model';
import { EpiserverFormAdapterService } from './episerver-form-adapter.service';

describe('EpiserverFormAdapterService', () => {
  it('normalizes existing uploaded files from the file upload value payload', () => {
    const service = new EpiserverFormAdapterService();
    const source: EpiserverFormDefinition = {
      contentGuid: 'form-guid',
      name: 'Property form',
      fields: [
        {
          contentGuid: 'upload-guid',
          type: 'FileUploadElementBlockProxy',
          value: '[{"DownloadUrl":"/globalassets/forms-upload-assets/demo-test2.pdf","Name":"demo-test.pdf"}]',
          properties: {
            Label: 'Attachment'
          }
        }
      ]
    };

    const form = service.adaptForm(source);
    const predefinedValue = form.formElements[0].properties.predefinedValue as any;

    expect(predefinedValue).toEqual([
      {
        name: 'demo-test.pdf',
        size: undefined,
        url: '/globalassets/forms-upload-assets/demo-test2.pdf'
      }
    ]);
    expect(form.formElements[0].properties.allowMultiple).toBeFalse();
    expect(form.formElements[0].properties.fileSize).toBeUndefined();
    expect(form.formElements[0].properties.fileTypes).toBeUndefined();
  });

  it('maps file upload properties from the proxy field metadata', () => {
    const service = new EpiserverFormAdapterService();
    const source: EpiserverFormDefinition = {
      contentGuid: 'form-guid',
      name: 'Property form',
      fields: [
        {
          contentGuid: 'upload-guid',
          type: 'FileUploadElementBlockProxy',
          properties: {
            Label: 'Attachment',
            AllowMultiple: true,
            FileSize: 3,
            FileTypes: 'pdf, png'
          }
        }
      ]
    };

    const form = service.adaptForm(source);

    expect(form.formElements[0].properties.allowMultiple).toBeTrue();
    expect(form.formElements[0].properties.fileSize).toBe(3);
    expect(form.formElements[0].properties.fileTypes).toBe('.pdf,.png');
  });

  it('maps raw Episerver conditions to library dependency metadata using source contentLink ids', () => {
    const service = new EpiserverFormAdapterService();
    const source: EpiserverFormDefinition = {
      contentGuid: 'form-guid',
      name: 'Property form',
      fields: [
        {
          contentGuid: 'source-guid',
          contentLink: { id: 31796 },
          type: 'SelectionElementBlockProxy',
          properties: {
            Label: 'Did you buy the property on a shared ownership scheme',
            Items: [
              { caption: 'Yes', value: 'Yes' },
              { caption: 'No', value: 'No' }
            ]
          }
        },
        {
          contentGuid: 'dependent-guid',
          contentLink: { id: 31799 },
          type: 'TextareaElementBlockProxy',
          properties: {
            Label: 'Shared Ownership (Yes TextArea)',
            Conditions: [{ field: { id: 31796 }, fieldValue: 'Yes', operator: 2 }],
            ConditionCombination: 0,
            SatisfiedAction: 'Show'
          }
        }
      ]
    };

    const form = service.adaptForm(source);
    const dependentField = form.formElements.find(field => field.key === 'dependent-guid');

    expect(dependentField?.properties.conditions).toEqual([
      {
        field: 'source-guid',
        fieldValue: 'Yes',
        operator: ConditionFunctionType.Equals
      }
    ]);
    expect(dependentField?.properties.conditionCombination).toBe(ConditionCombinationType.Any);
    expect(dependentField?.properties.satisfiedAction).toBe(SatisfiedActionType.Show);
  });
});
