import { evaluateFieldVisibility } from './episerver-form-accordion-visibility.util';
import { EpiserverFieldDefinition } from '../../episerver-forms/models/episerver-form-definition.model';

describe('evaluateFieldVisibility', () => {
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
        Conditions: [
          {
            field: { id: 31796 },
            fieldValue: 'Yes'
          }
        ]
      }
    }
  ];

  it('shows a dependent field when the selected value matches', () => {
    const result = evaluateFieldVisibility(fields, { 'source-31796': 'Yes' });

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
    const result = evaluateFieldVisibility(fields, { 'source-31796': 'No' });

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

    const visibleResult = evaluateFieldVisibility(nestedFields, {
      'source-31796': 'Yes',
      'dependent-31799': 'visible'
    });
    expect(visibleResult.visibilityByGuid['nested-31801']).toBe(true);

    const hiddenResult = evaluateFieldVisibility(nestedFields, {
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
      evaluateFieldVisibility(multiFields, { 'source-31796': 'Yes', 'source-31850': 'Ready' }).visibilityByGuid['dependent-31851']
    ).toBe(true);
    expect(
      evaluateFieldVisibility(multiFields, { 'source-31796': 'Yes', 'source-31850': 'Nope' }).visibilityByGuid['dependent-31851']
    ).toBe(false);
  });
});
