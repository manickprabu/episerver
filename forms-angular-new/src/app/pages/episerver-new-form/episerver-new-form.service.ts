import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ConditionCombinationType, ConditionFunctionType } from '../../episerver-forms/episerver-sdk';
import { EpiserverFormAdapterService } from '../../episerver-forms/services/episerver-form-adapter.service';
import { EpiserverFieldCondition, EpiserverFieldDefinition, EpiserverFormDefinition } from '../../episerver-forms/models/episerver-form-definition.model';
import { FormField, FormSchema } from '../../episerver-forms/models/form-schema.model';
import { EpiserverFormAccordionService } from '../episerver-form-accordion/episerver-form-accordion.service';

@Injectable({ providedIn: 'root' })
export class EpiserverNewFormService {
  constructor(
    private readonly episerverFormAccordionService: EpiserverFormAccordionService,
    private readonly episerverFormAdapterService: EpiserverFormAdapterService
  ) {}

  loadMockForm(): Observable<EpiserverFormDefinition> {
    return this.episerverFormAccordionService.loadForm();
  }

  buildFormSchema(source: EpiserverFormDefinition): FormSchema {
    const form = this.episerverFormAdapterService.adaptForm(source);
    const fieldKeyByContentLinkId = new Map<number, string>();

    source.fields.forEach(field => {
      const ids = [field.contentLink?.id, field.id].filter((id): id is number => typeof id === 'number');
      for (const id of ids) {
        fieldKeyByContentLinkId.set(id, field.contentGuid);
      }
    });

    form.formElements = form.formElements.map(field => this.applyDependencyMetadata(field as FormField, source.fields, fieldKeyByContentLinkId));
    return form;
  }

  stepTitle(source: EpiserverFormDefinition, stepFieldKeys: Set<string>, fallback: string): string {
    const titleField = source.fields.find(
      field => stepFieldKeys.has(field.contentGuid) && field.name === 'Title' && field.type === 'PredefinedHiddenElementBlockProxy' && typeof field.properties.PredefinedValue === 'string' && field.properties.PredefinedValue.trim().length > 0
    );

    return titleField?.properties.PredefinedValue ?? fallback;
  }

  private applyDependencyMetadata(field: FormField, sourceFields: EpiserverFieldDefinition[], fieldKeyByContentLinkId: Map<number, string>): FormField {
    const sourceField = sourceFields.find(item => item.contentGuid === field.key);
    if (!sourceField) {
      return field;
    }

    const conditions = (sourceField.properties.Conditions ?? []).map(condition => this.mapCondition(condition, fieldKeyByContentLinkId)).filter((condition): condition is NonNullable<typeof condition> => condition !== null);

    if (conditions.length === 0 && !sourceField.properties.SatisfiedAction) {
      return field;
    }

    return {
      ...field,
      properties: {
        ...field.properties,
        conditions,
        conditionCombination: this.mapConditionCombination(sourceField.properties.ConditionCombination),
        satisfiedAction: this.mapSatisfiedAction(sourceField.properties.SatisfiedAction)
      }
    };
  }

  private mapCondition(condition: EpiserverFieldCondition, fieldKeyByContentLinkId: Map<number, string>): { field: string; operator: string; fieldValue: string } | null {
    const sourceFieldId = condition.field?.id;
    if (typeof sourceFieldId !== 'number') {
      return null;
    }

    const fieldKey = fieldKeyByContentLinkId.get(sourceFieldId);
    if (!fieldKey) {
      return null;
    }

    return {
      field: fieldKey,
      operator: this.mapConditionOperator(condition.operator),
      fieldValue: String(condition.fieldValue ?? '')
    };
  }

  private mapConditionCombination(combination: number | string | undefined): string {
    const normalized = String(combination ?? '').toLowerCase();
    return normalized === '0' || normalized === 'or' || normalized === 'any' ? ConditionCombinationType.Any : ConditionCombinationType.All;
  }

  private mapSatisfiedAction(action: string | undefined): string {
    const normalized = String(action ?? '').toLowerCase();
    return normalized.includes('hide') ? 'Hide' : 'Show';
  }

  private mapConditionOperator(operator: number | string | null | undefined): string {
    if (typeof operator === 'string' && operator.trim().length > 0) {
      return operator;
    }

    switch (Number(operator)) {
      case 0:
        return ConditionFunctionType.Contains;
      case 1:
        return ConditionFunctionType.NotContains;
      case 2:
        return ConditionFunctionType.Equals;
      case 3:
        return ConditionFunctionType.NotEquals;
      case 4:
        return ConditionFunctionType.MatchRegularExpression;
      default:
        return ConditionFunctionType.Equals;
    }
  }
}
