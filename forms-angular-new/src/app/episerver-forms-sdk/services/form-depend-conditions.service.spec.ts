import { TestBed } from '@angular/core/testing';

import { ConditionCombinationType, FormElementBase } from '../models';
import { ConditionFunctionsService } from './condition-functions.service';
import { FormDependConditionsService } from './form-depend-conditions.service';

const element: FormElementBase = {
  key: 'conditional',
  contentType: 'TextboxElementBlock',
  displayName: 'Conditional',
  properties: {
    description: '',
    label: 'Conditional',
    conditionCombination: ConditionCombinationType.All,
    conditions: [
      {
        field: 'gender',
        operator: 'Equals',
        fieldValue: 'Male'
      }
    ]
  },
  localizations: {},
  locale: 'en'
};

describe('FormDependConditionsService', () => {
  let service: FormDependConditionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConditionFunctionsService, FormDependConditionsService]
    });
    service = TestBed.inject(FormDependConditionsService);
  });

  it('returns true when all conditions are satisfied', () => {
    expect(service.checkConditions(element, [{ elementKey: 'gender', value: 'Male' }])).toBe(true);
  });

  it('returns false when a condition is not satisfied', () => {
    expect(service.checkConditions(element, [{ elementKey: 'gender', value: 'Female' }])).toBe(false);
  });
});
