import { TestBed } from '@angular/core/testing';

import { ConditionFunctionType } from '../models';
import { ConditionFunctionsService } from './condition-functions.service';

describe('ConditionFunctionsService', () => {
  let service: ConditionFunctionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ConditionFunctionsService] });
    service = TestBed.inject(ConditionFunctionsService);
  });

  it('compares values using contains', () => {
    expect(service.get(ConditionFunctionType.Contains)?.('Male,Female', 'male')).toBe(true);
  });

  it('matches values with regex', () => {
    expect(service.get(ConditionFunctionType.MatchRegularExpression)?.('AB-123', '^AB-\\d+$')).toBe(true);
  });
});
