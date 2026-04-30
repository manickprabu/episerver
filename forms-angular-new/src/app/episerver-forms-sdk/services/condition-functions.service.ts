import { Injectable } from '@angular/core';

import { ConditionFunctionType } from '../models';
import { getConcatString, isNull, isNullOrEmpty } from '../utils';

export type ConditionFunction = (actualValue: unknown, patternOfExpected: string) => boolean;

@Injectable()
export class ConditionFunctionsService {
  readonly functions: Record<string, ConditionFunction> = {
    [ConditionFunctionType.Contains]: (actualValue, dependencyFieldValue) => {
      const normalized = isNull(actualValue)
        ? ''
        : getConcatString(String(actualValue), ',').toLocaleUpperCase();
      const expected = dependencyFieldValue ? dependencyFieldValue.toLocaleUpperCase() : '';
      return normalized.indexOf(expected) >= 0;
    },
    [ConditionFunctionType.NotContains]: (actualValue, dependencyFieldValue) => {
      const normalized = !actualValue ? '' : getConcatString(String(actualValue), ',').toLocaleUpperCase();
      const actualValueNull = isNullOrEmpty(normalized);
      const dependencyFieldValueNull = isNullOrEmpty(dependencyFieldValue);
      return (
        (!actualValueNull && dependencyFieldValueNull) ||
        (actualValueNull && !dependencyFieldValueNull) ||
        (!actualValueNull &&
          !dependencyFieldValueNull &&
          normalized.indexOf(dependencyFieldValue.toLocaleUpperCase()) < 0)
      );
    },
    [ConditionFunctionType.Equals]: (actualValue, dependencyFieldValue) => {
      const normalized = isNullOrEmpty(actualValue as string)
        ? ''
        : getConcatString(String(actualValue), ',').toLocaleUpperCase();
      const expected = dependencyFieldValue ? dependencyFieldValue.toLocaleUpperCase() : '';
      return normalized === expected;
    },
    [ConditionFunctionType.NotEquals]: (actualValue, dependencyFieldValue) => {
      const normalized = !actualValue ? '' : getConcatString(String(actualValue), ',').toLocaleUpperCase();
      const expected = dependencyFieldValue ? dependencyFieldValue.toLocaleUpperCase() : '';
      return normalized !== expected;
    },
    [ConditionFunctionType.MatchRegularExpression]: (actualValue, patternOfExpected) => {
      const regex = new RegExp(patternOfExpected, 'igm');
      const normalized = !actualValue ? '' : getConcatString(String(actualValue), ',');
      return isNullOrEmpty(patternOfExpected) || regex.test(normalized);
    }
  };

  get(operator: string): ConditionFunction | undefined {
    return this.functions[operator];
  }
}
