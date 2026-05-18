import '@angular/compiler';

import { EpiserverFormAdapterService } from '../../episerver-forms/services/episerver-form-adapter.service';
import { EpiserverFormDefinition } from '../../episerver-forms/models/episerver-form-definition.model';
import { EpiserverNewFormService } from './episerver-new-form.service';

describe('EpiserverNewFormService', () => {
  it('maps dependency conditions using top-level field id when contentLink.id is missing', () => {
    const service = new EpiserverNewFormService(
      {
        loadForm: () => {
          throw new Error('not used');
        }
      } as never,
      new EpiserverFormAdapterService()
    );

    const formDefinition: EpiserverFormDefinition = {
      contentGuid: 'form-guid',
      name: 'Test form',
      fields: [
        {
          name: 'Is the property a probate sale, in receivership, held by a Trust or owned by a developer?',
          id: 31801,
          contentGuid: 'cb818013-6cf8-409c-aff7-e0d599b431a9',
          type: 'SelectionElementBlockProxy',
          value: 'No',
          properties: {
            Label: 'Question',
            Items: [
              { caption: 'Yes', value: 'Yes', checked: false },
              { caption: 'No', value: 'No', checked: false }
            ],
            Conditions: []
          }
        },
        {
          name: 'Seller Type (Yes)',
          id: 31802,
          contentGuid: 'e3085a78-5fb8-4736-ae5b-94d5d4ed7763',
          type: 'TextareaElementBlockProxy',
          value: '',
          properties: {
            Label: 'Please specify which',
            SatisfiedAction: 'EPiServer.Forms.Core.Internal.Dependency.ShowAction',
            ConditionCombination: 1,
            Conditions: [
              {
                field: { id: 31801 },
                operator: 2,
                fieldValue: 'Yes'
              }
            ]
          }
        }
      ]
    };

    const form = service.buildFormSchema(formDefinition);
    const dependentField = form.formElements.find(field => field.key === 'e3085a78-5fb8-4736-ae5b-94d5d4ed7763');

    expect(dependentField?.properties.conditions).toEqual([
      {
        field: 'cb818013-6cf8-409c-aff7-e0d599b431a9',
        operator: 'Equals',
        fieldValue: 'Yes'
      }
    ]);
  });
});
