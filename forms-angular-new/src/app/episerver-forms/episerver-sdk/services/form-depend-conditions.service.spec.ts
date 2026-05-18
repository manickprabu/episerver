import '@angular/compiler';
import { firstValueFrom } from 'rxjs';
import { skip, take } from 'rxjs/operators';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { ConditionFunctionsService } from './condition-functions.service';
import { EpiserverFieldDefinitionLike, FieldVisibilityState, FormDependConditionsService } from './form-depend-conditions.service';

const sourceField: EpiserverFieldDefinitionLike = {
  name: 'Did you buy the property on a shared ownership scheme',
  contentGuid: 'source-31796',
  contentLink: { id: 31796 },
  properties: {
    Label: 'Did you buy the property on a shared ownership scheme?',
    Conditions: []
  }
};

const dependentField: EpiserverFieldDefinitionLike = {
  name: 'Shared Ownership (Yes TextArea)',
  contentGuid: 'dependent-31799',
  contentLink: { id: 31799 },
  properties: {
    Label: 'Please state the percentage share being sold',
    SatisfiedAction: 'EPiServer.Forms.Core.Internal.Dependency.ShowAction',
    ConditionCombination: 1,
    Conditions: [
      {
        field: { id: 31796 },
        operator: 2,
        fieldValue: 'Yes'
      }
    ]
  }
};

describe('FormDependConditionsService', () => {
  let service: FormDependConditionsService;

  beforeEach(() => {
    service = new FormDependConditionsService(new ConditionFunctionsService());
  });

  function createFormGroup(initialSourceValue = 'No') {
    return new FormGroup({
      'source-31796': new FormControl(initialSourceValue),
      'dependent-31799': new FormControl('', Validators.required)
    });
  }

  function isVisible(state: FieldVisibilityState, guid: string): boolean {
    return service.isFieldVisible(guid, state);
  }

  it('detects dependent fields from Conditions[] and hides by default when condition is not met', () => {
    const state = service.evaluateFieldVisibility([sourceField, dependentField], { 'source-31796': 'No' });

    expect(isVisible(state, 'source-31796')).toBe(true);
    expect(isVisible(state, 'dependent-31799')).toBe(false);
    expect(state.evaluations[0]).toEqual(
      jasmine.objectContaining({
        dependentFieldId: 31799,
        sourceFieldId: 31796,
        expectedValue: 'Yes',
        visible: false
      })
    );
  });

  it('returns visible when selected value equals condition.fieldValue', () => {
    const state = service.evaluateFieldVisibility([sourceField, dependentField], { 'source-31796': 'Yes' });

    expect(isVisible(state, 'dependent-31799')).toBe(true);
  });

  it('updates visibility when source control value changes', async () => {
    const formGroup = createFormGroup('No');
    const visibility$ = service.watchVisibility([sourceField, dependentField], formGroup);
    const firstState = await firstValueFrom(visibility$);
    const nextStatePromise = firstValueFrom(visibility$.pipe(skip(1), take(1)));

    formGroup.get('source-31796')?.setValue('Yes');
    const nextState = await nextStatePromise;

    expect(isVisible(firstState, 'dependent-31799')).toBe(false);
    expect(isVisible(nextState, 'dependent-31799')).toBe(true);
  });

  it('supports initial preselected values, patchValue(), and setValue()', () => {
    const formGroup = createFormGroup('Yes');
    expect(isVisible(service.evaluateFieldVisibility([sourceField, dependentField], formGroup.getRawValue()), 'dependent-31799')).toBe(true);

    formGroup.patchValue({ 'source-31796': 'No' });
    expect(isVisible(service.evaluateFieldVisibility([sourceField, dependentField], formGroup.getRawValue()), 'dependent-31799')).toBe(false);

    formGroup.get('source-31796')?.setValue('Yes');
    expect(isVisible(service.evaluateFieldVisibility([sourceField, dependentField], formGroup.getRawValue()), 'dependent-31799')).toBe(true);
  });

  it('supports adapted form fields keyed by field.key for dropdown-driven visibility', () => {
    const adaptedSourceField: EpiserverFieldDefinitionLike = {
      key: 'source-guid',
      contentGuid: 'source-guid',
      properties: {
        label: 'Did you buy the property on a shared ownership scheme?',
        contentLinkId: 31796,
        items: [
          { caption: 'Yes', value: 'Yes', checked: false },
          { caption: 'No', value: 'No', checked: false }
        ],
        conditions: []
      }
    } as EpiserverFieldDefinitionLike;

    const adaptedDependentField: EpiserverFieldDefinitionLike = {
      key: 'dependent-guid',
      contentGuid: 'dependent-guid',
      properties: {
        label: 'Please state the percentage share being sold',
        contentLinkId: 31799,
        satisfiedAction: 'show',
        conditionCombination: 'All',
        conditions: [{ field: 'source-guid', operator: 'Equals', fieldValue: 'Yes' }]
      }
    } as EpiserverFieldDefinitionLike;

    const hiddenState = service.evaluateFieldVisibility([adaptedSourceField, adaptedDependentField], { 'source-guid': 'No' });
    const visibleState = service.evaluateFieldVisibility([adaptedSourceField, adaptedDependentField], { 'source-guid': 'Yes' });

    expect(isVisible(hiddenState, 'dependent-guid')).toBe(false);
    expect(isVisible(visibleState, 'dependent-guid')).toBe(true);
  });

  it('supports multiple dependent fields', () => {
    const secondDependent: EpiserverFieldDefinitionLike = {
      contentGuid: 'dependent-31800',
      contentLink: { id: 31800 },
      properties: {
        Label: 'Second dependent',
        Conditions: [{ field: { id: 31796 }, operator: 2, fieldValue: 'Yes' }]
      }
    };

    const state = service.evaluateFieldVisibility([sourceField, dependentField, secondDependent], { 'source-31796': 'Yes' });

    expect(isVisible(state, 'dependent-31799')).toBe(true);
    expect(isVisible(state, 'dependent-31800')).toBe(true);
  });

  it('supports AND conditions', () => {
    const secondSource: EpiserverFieldDefinitionLike = {
      contentGuid: 'source-40000',
      contentLink: { id: 40000 },
      properties: { Label: 'Second source', Conditions: [] }
    };
    const andDependent: EpiserverFieldDefinitionLike = {
      contentGuid: 'dependent-and',
      contentLink: { id: 40001 },
      properties: {
        Label: 'AND dependent',
        ConditionCombination: 1,
        Conditions: [
          { field: { id: 31796 }, operator: 2, fieldValue: 'Yes' },
          { field: { id: 40000 }, operator: 2, fieldValue: 'Ready' }
        ]
      }
    };

    const hiddenState = service.evaluateFieldVisibility([sourceField, secondSource, andDependent], { 'source-31796': 'Yes', 'source-40000': 'Nope' });
    const visibleState = service.evaluateFieldVisibility([sourceField, secondSource, andDependent], { 'source-31796': 'Yes', 'source-40000': 'Ready' });

    expect(isVisible(hiddenState, 'dependent-and')).toBe(false);
    expect(isVisible(visibleState, 'dependent-and')).toBe(true);
  });

  it('supports OR conditions', () => {
    const secondSource: EpiserverFieldDefinitionLike = {
      contentGuid: 'source-50000',
      contentLink: { id: 50000 },
      properties: { Label: 'Second source', Conditions: [] }
    };
    const orDependent: EpiserverFieldDefinitionLike = {
      contentGuid: 'dependent-or',
      contentLink: { id: 50001 },
      properties: {
        Label: 'OR dependent',
        ConditionCombination: 0,
        Conditions: [
          { field: { id: 31796 }, operator: 2, fieldValue: 'Yes' },
          { field: { id: 50000 }, operator: 2, fieldValue: 'Ready' }
        ]
      }
    };

    const state = service.evaluateFieldVisibility([sourceField, secondSource, orDependent], { 'source-31796': 'No', 'source-50000': 'Ready' });

    expect(isVisible(state, 'dependent-or')).toBe(true);
  });

  it('handles missing Conditions, source field, and source control safely', () => {
    const fieldWithoutConditions: EpiserverFieldDefinitionLike = {
      contentGuid: 'standalone',
      contentLink: { id: 60000 },
      properties: { Label: 'Standalone', Conditions: [] }
    };
    const missingSourceDependent: EpiserverFieldDefinitionLike = {
      contentGuid: 'missing-source-dependent',
      contentLink: { id: 60001 },
      properties: {
        Label: 'Missing source dependent',
        Conditions: [{ field: { id: 99999 }, operator: 2, fieldValue: 'Yes' }]
      }
    };

    const state = service.evaluateFieldVisibility([fieldWithoutConditions, missingSourceDependent], {});

    expect(isVisible(state, 'standalone')).toBe(true);
    expect(isVisible(state, 'missing-source-dependent')).toBe(false);
  });

  it('disables hidden required fields and restores them when visible again', () => {
    const formGroup = createFormGroup('No');
    const disabledByService = new Set<string>();

    const hiddenState = service.evaluateFieldVisibility([sourceField, dependentField], formGroup.getRawValue());
    service.syncHiddenControls([sourceField, dependentField], formGroup, hiddenState, disabledByService);

    expect(formGroup.get('dependent-31799')?.disabled).toBe(true);
    expect(formGroup.valid).toBe(true);

    formGroup.get('source-31796')?.setValue('Yes');
    const visibleState = service.evaluateFieldVisibility([sourceField, dependentField], formGroup.getRawValue());
    service.syncHiddenControls([sourceField, dependentField], formGroup, visibleState, disabledByService);

    expect(formGroup.get('dependent-31799')?.enabled).toBe(true);
  });
});
