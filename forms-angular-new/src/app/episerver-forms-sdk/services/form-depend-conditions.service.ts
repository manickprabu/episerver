import { Injectable } from '@angular/core';

import {
  ConditionCombinationType,
  ElementDependencies,
  FormElementBase,
  FormSubmission,
  RuleConditionProperties
} from '../models';
import { getValueOfDependeeElement, isNull } from '../utils';
import { ConditionFunctionsService } from './condition-functions.service';

@Injectable()
export class FormDependConditionsService {
  constructor(private readonly conditionFunctionsService: ConditionFunctionsService) {}

  checkConditions(
    element: FormElementBase,
    formSubmissions: FormSubmission[],
    elementDependencies: ElementDependencies[] = []
  ): boolean {
    if (isNull(formSubmissions)) {
      return false;
    }

    const conditionProps = element.properties as unknown as RuleConditionProperties;
    if (isNull(conditionProps?.conditions)) {
      return true;
    }

    for (let index = 0; index < conditionProps.conditions.length; index += 1) {
      const condition = conditionProps.conditions[index];
      const dependeeFieldValue = getValueOfDependeeElement(condition, formSubmissions, elementDependencies);
      const conditionFunction = this.conditionFunctionsService.get(condition.operator);

      if (conditionFunction) {
        const checkResult = conditionFunction(
          dependeeFieldValue == null ? '' : dependeeFieldValue.toString(),
          condition.fieldValue
        );

        if (conditionProps.conditionCombination === ConditionCombinationType.Any && checkResult) {
          return true;
        }

        if (conditionProps.conditionCombination !== ConditionCombinationType.Any && !checkResult) {
          return false;
        }
      }
    }

    return conditionProps.conditionCombination !== ConditionCombinationType.Any;
  }
}
