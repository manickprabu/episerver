import { firstValueFrom } from 'rxjs';
import { skip, take } from 'rxjs/operators';
import { FormControl, FormGroup } from '@angular/forms';

import { EpiserverFormAccordionVisibilityService } from './episerver-form-accordion-visibility.service';
import { EpiserverFieldDefinition } from '../../episerver-forms/models/episerver-form-definition.model';

describe('EpiserverFormAccordionVisibilityService', () => {
  const fields: EpiserverFieldDefinition[] = [
    {
      name: 'Did you buy the property on a shared ownership scheme',
      contentLink: { id: 31796 },
      contentGuid: 'source-31796',
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
      name: 'Shared Ownership (Yes TextArea)',
      contentLink: { id: 31799 },
      contentGuid: 'dependent-31799',
      type: 'TextareaElementBlockProxy',
      properties: {
        Label: 'Please state the percentage share being sold',
        SatisfiedAction: 'EPiServer.Forms.Core.Internal.Dependency.ShowAction',
        ConditionCombination: 1,
        Conditions: [{ field: { id: 31796 }, fieldValue: 'Yes' }]
      }
    }
  ];

  let service: EpiserverFormAccordionVisibilityService;

  beforeEach(() => {
    service = new EpiserverFormAccordionVisibilityService();
  });

  it('reacts to form control value changes', async () => {
    const formGroup = new FormGroup({
      'source-31796': new FormControl('No'),
      'dependent-31799': new FormControl('')
    });

    const visibility$ = service.watchVisibility(fields, formGroup);
    const firstState = await firstValueFrom(visibility$);
    const nextStatePromise = firstValueFrom(visibility$.pipe(skip(1), take(1)));

    formGroup.get('source-31796')?.setValue('Yes');
    const nextState = await nextStatePromise;

    expect(firstState.visibilityByGuid['dependent-31799']).toBe(false);
    expect(nextState.visibilityByGuid['dependent-31799']).toBe(true);
  });

  it('shows a dependent field when the selected value matches', () => {
    const result = service.evaluateFieldVisibility(fields, { 'source-31796': 'Yes' });

    expect(result.visibilityByGuid['dependent-31799']).toBe(true);
    expect(result.evaluations).toEqual([
      expect.objectContaining({
        dependentFieldId: 31799,
        dependentFieldName: 'Shared Ownership (Yes TextArea)',
        sourceFieldId: 31796,
        sourceFieldName: 'Did you buy the property on a shared ownership scheme',
        selectedValue: 'Yes',
        expectedValue: 'Yes',
        visible: true
      })
    ]);
  });

  it('hides a dependent field when the selected value does not match', () => {
    const result = service.evaluateFieldVisibility(fields, { 'source-31796': 'No' });

    expect(result.visibilityByGuid['dependent-31799']).toBe(false);
    expect(result.evaluations[0].visible).toBe(false);
  });

  it('supports nested dependencies', () => {
    const nestedFields: EpiserverFieldDefinition[] = [
      ...fields,
      {
        name: 'Nested dependent field',
        contentLink: { id: 31801 },
        contentGuid: 'nested-31801',
        type: 'TextboxElementBlockProxy',
        properties: {
          Label: 'Nested dependent field',
          Conditions: [
            {
              field: { id: 31799 },
              fieldValue: 'visible'
            }
          ]
        }
      }
    ];

    const visibleResult = service.evaluateFieldVisibility(nestedFields, {
      'source-31796': 'Yes',
      'dependent-31799': 'visible'
    });
    expect(visibleResult.visibilityByGuid['nested-31801']).toBe(true);

    const hiddenResult = service.evaluateFieldVisibility(nestedFields, {
      'source-31796': 'No',
      'dependent-31799': 'visible'
    });
    expect(hiddenResult.visibilityByGuid['nested-31801']).toBe(false);
  });

  it('supports multiple conditions', () => {
    const multiFields: EpiserverFieldDefinition[] = [
      ...fields,
      {
        name: 'Second source',
        contentLink: { id: 31850 },
        contentGuid: 'source-31850',
        type: 'SelectionElementBlockProxy',
        properties: { Label: 'Second source' }
      },
      {
        name: 'Two-condition field',
        contentLink: { id: 31851 },
        contentGuid: 'dependent-31851',
        type: 'TextboxElementBlockProxy',
        properties: {
          Label: 'Two-condition field',
          ConditionCombination: 1,
          Conditions: [
            { field: { id: 31796 }, fieldValue: 'Yes' },
            { field: { id: 31850 }, fieldValue: 'Ready' }
          ]
        }
      }
    ];

    expect(
      service.evaluateFieldVisibility(multiFields, { 'source-31796': 'Yes', 'source-31850': 'Ready' }).visibilityByGuid[
        'dependent-31851'
      ]
    ).toBe(true);
    expect(
      service.evaluateFieldVisibility(multiFields, { 'source-31796': 'Yes', 'source-31850': 'Nope' }).visibilityByGuid[
        'dependent-31851'
      ]
    ).toBe(false);
  });
});
