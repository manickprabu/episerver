import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, startWith } from 'rxjs/operators';

import { ConditionCombinationType, ElementDependencies, FormElementBase, FormSubmission, RuleConditionProperties } from '../models';
import { getValueOfDependeeElement, isNull } from '../utils';
import { ConditionFunctionsService } from './condition-functions.service';

export interface EpiserverConditionFieldRef {
  id?: number;
}

export interface EpiserverFieldConditionLike {
  field?: EpiserverConditionFieldRef | null;
  operator?: number | string | null;
  fieldValue?: string | null;
}

export interface EpiserverFieldDefinitionLike {
  name?: string;
  key?: string;
  id?: number;
  contentGuid?: string;
  contentLink?: { id?: number } | null;
  editViewFriendlyTitle?: string;
  properties: {
    Label?: string;
    label?: string;
    description?: string;
    Conditions?: EpiserverFieldConditionLike[];
    conditions?: Array<{ field?: string | null; operator?: number | string | null; fieldValue?: string | null }>;
    ConditionCombination?: number | string;
    conditionCombination?: number | string;
    SatisfiedAction?: string;
    satisfiedAction?: string;
    contentLinkId?: number;
  };
}

export interface FieldDependencyEvaluation {
  dependentFieldId: number;
  dependentFieldName: string;
  sourceFieldId: number;
  sourceFieldName: string;
  selectedValue: unknown;
  expectedValue: string;
  visible: boolean;
}

export interface FieldVisibilityState {
  visibilityByGuid: Record<string, boolean>;
  visibilityByContentLinkId: Record<number, boolean>;
  evaluations: FieldDependencyEvaluation[];
}

@Injectable()
export class FormDependConditionsService {
  constructor(private readonly conditionFunctionsService: ConditionFunctionsService) {}

  private readonly defaultVisibleState: FieldVisibilityState = {
    visibilityByGuid: {},
    visibilityByContentLinkId: {},
    evaluations: []
  };

  checkConditions(element: FormElementBase, formSubmissions: FormSubmission[], elementDependencies: ElementDependencies[] = []): boolean {
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
        const checkResult = conditionFunction(dependeeFieldValue == null ? '' : dependeeFieldValue.toString(), condition.fieldValue);

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

  watchVisibility(fields: EpiserverFieldDefinitionLike[], formGroup: FormGroup): Observable<FieldVisibilityState> {
    return formGroup.valueChanges.pipe(
      startWith(formGroup.getRawValue()),
      map(values => this.evaluateFieldVisibility(fields, values as Record<string, unknown>)),
      distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  evaluateFieldVisibility(fields: EpiserverFieldDefinitionLike[] | null | undefined, valuesByGuid: Record<string, unknown> | null | undefined): FieldVisibilityState {
    if (!fields?.length) {
      return this.defaultVisibleState;
    }

    const safeValues = valuesByGuid ?? {};
    const fieldsByContentLinkId = new Map<number, EpiserverFieldDefinitionLike>();
    const normalizedFieldsByGuid = new Map<string, FormElementBase>();
    const visibilityCache = new Map<string, boolean>();
    const evaluations: FieldDependencyEvaluation[] = [];
    const visibilityByGuid: Record<string, boolean> = {};
    const visibilityByContentLinkId: Record<number, boolean> = {};

    fields.forEach(field => {
      const fieldId = this.fieldId(field);
      if (typeof fieldId === 'number') {
        fieldsByContentLinkId.set(fieldId, field);
      }
    });

    fields.forEach(field => {
      normalizedFieldsByGuid.set(this.fieldKey(field), this.toNormalizedField(field, fieldsByContentLinkId));
    });

    fields.forEach(field => {
      const visible = this.evaluateFieldVisibilityInternal(field, safeValues, normalizedFieldsByGuid, fieldsByContentLinkId, visibilityCache, new Set<string>(), evaluations);

      visibilityByGuid[this.fieldKey(field)] = visible;
      const fieldId = this.fieldId(field);
      if (typeof fieldId === 'number') {
        visibilityByContentLinkId[fieldId] = visible;
      }
    });

    return {
      visibilityByGuid,
      visibilityByContentLinkId,
      evaluations
    };
  }

  isFieldVisible(fieldContentGuid: string, state: FieldVisibilityState | null | undefined): boolean {
    if (!state) {
      return true;
    }

    return state.visibilityByGuid[fieldContentGuid] ?? true;
  }

  syncHiddenControls(fields: EpiserverFieldDefinitionLike[], formGroup: FormGroup, state: FieldVisibilityState | null | undefined, disabledByService?: Set<string>): void {
    const managedDisabledKeys = disabledByService ?? new Set<string>();

    for (const field of fields) {
      const controlKey = this.fieldKey(field);
      const control = formGroup.get(controlKey);
      if (!control) {
        continue;
      }

      const isVisible = this.isFieldVisible(controlKey, state);

      if (isVisible) {
        if (managedDisabledKeys.has(controlKey)) {
          control.enable({ emitEvent: false });
          control.updateValueAndValidity({ emitEvent: false });
          managedDisabledKeys.delete(controlKey);
        }
        continue;
      }

      if (!control.disabled) {
        control.disable({ emitEvent: false });
        control.markAsUntouched();
        control.updateValueAndValidity({ emitEvent: false });
        managedDisabledKeys.add(controlKey);
      }
    }
  }

  private toNormalizedField(field: EpiserverFieldDefinitionLike, fieldsByContentLinkId: Map<number, EpiserverFieldDefinitionLike>): FormElementBase {
    const rawConditions = field.properties.conditions ?? field.properties.Conditions ?? [];
    const conditions = rawConditions
      .map(condition => {
        const sourceFieldRef = condition.field;
        if (typeof sourceFieldRef === 'string') {
          return {
            field: sourceFieldRef,
            operator: this.normalizeOperator(condition.operator),
            fieldValue: condition.fieldValue ?? ''
          };
        }

        const sourceFieldId = sourceFieldRef?.id;
        if (typeof sourceFieldId !== 'number') {
          return null;
        }

        const sourceField = fieldsByContentLinkId.get(sourceFieldId);
        if (!sourceField) {
          return null;
        }

        return {
          field: this.fieldKey(sourceField),
          operator: this.normalizeOperator(condition.operator),
          fieldValue: condition.fieldValue ?? ''
        };
      })
      .filter((condition): condition is { field: string; operator: string; fieldValue: string } => condition !== null);

    const normalizedProperties = {
      label: this.fieldLabel(field),
      description: field.properties.description ?? '',
      conditions,
      hasUnresolvedConditions: rawConditions.length > 0 && conditions.length === 0,
      conditionCombination: this.normalizeConditionCombination(field.properties.conditionCombination ?? field.properties.ConditionCombination),
      satisfiedAction: this.normalizeSatisfiedAction(field.properties.satisfiedAction ?? field.properties.SatisfiedAction)
    } as Record<string, unknown>;

    return {
      key: this.fieldKey(field),
      contentType: '',
      displayName: this.fieldLabel(field),
      properties: normalizedProperties as unknown as FormElementBase['properties'],
      localizations: {},
      locale: 'en'
    };
  }

  private evaluateFieldVisibilityInternal(
    field: EpiserverFieldDefinitionLike,
    valuesByGuid: Record<string, unknown>,
    normalizedFieldsByGuid: Map<string, FormElementBase>,
    fieldsByContentLinkId: Map<number, EpiserverFieldDefinitionLike>,
    visibilityCache: Map<string, boolean>,
    visiting: Set<string>,
    evaluations: FieldDependencyEvaluation[]
  ): boolean {
    const fieldKey = this.fieldKey(field);

    if (visibilityCache.has(fieldKey)) {
      return visibilityCache.get(fieldKey) ?? true;
    }

    if (visiting.has(fieldKey)) {
      return false;
    }

    const normalizedField = normalizedFieldsByGuid.get(fieldKey);
    const conditions = normalizedField?.properties['conditions'] as Array<{ field: string; operator: string; fieldValue: string }> | undefined;
    const normalizedProperties = normalizedField?.properties as Record<string, unknown> | undefined;
    const hasUnresolvedConditions = Boolean(normalizedProperties?.['hasUnresolvedConditions']);

    if (!normalizedField) {
      visibilityCache.set(fieldKey, true);
      return true;
    }

    if (hasUnresolvedConditions) {
      visibilityCache.set(fieldKey, false);
      return false;
    }

    if (!conditions || conditions.length === 0) {
      visibilityCache.set(fieldKey, true);
      return true;
    }

    visiting.add(fieldKey);

    const dependencyStates: ElementDependencies[] = [];
    for (const condition of conditions) {
      const sourceField = Array.from(fieldsByContentLinkId.values()).find(candidate => this.fieldKey(candidate) === condition.field);
      if (!sourceField) {
        dependencyStates.push({ elementKey: condition.field, isSatisfied: false });
        continue;
      }

      const sourceVisible = this.evaluateFieldVisibilityInternal(sourceField, valuesByGuid, normalizedFieldsByGuid, fieldsByContentLinkId, visibilityCache, visiting, evaluations);

      dependencyStates.push({ elementKey: condition.field, isSatisfied: sourceVisible });
      evaluations.push({
        dependentFieldId: this.fieldId(field) ?? -1,
        dependentFieldName: this.fieldLabel(field),
        sourceFieldId: this.fieldId(sourceField) ?? -1,
        sourceFieldName: this.fieldLabel(sourceField),
        selectedValue: valuesByGuid[this.fieldKey(sourceField)],
        expectedValue: condition.fieldValue,
        visible: sourceVisible && this.matchesCondition(condition, valuesByGuid[this.fieldKey(sourceField)])
      });
    }

    const formSubmissions = Object.entries(valuesByGuid).map(([elementKey, value]) => ({ elementKey, value }));
    const conditionsSatisfied = this.checkConditions(normalizedField, formSubmissions, dependencyStates);
    const satisfiedAction = String(normalizedField.properties['satisfiedAction'] ?? '').toLowerCase();
    const visible = conditionsSatisfied ? satisfiedAction === 'show' : satisfiedAction === 'hide';

    visibilityCache.set(fieldKey, visible);
    visiting.delete(fieldKey);
    return visible;
  }

  private matchesCondition(condition: { operator: string; fieldValue: string }, actualValue: unknown): boolean {
    const conditionFunction = this.conditionFunctionsService.get(condition.operator);
    if (!conditionFunction) {
      return false;
    }

    return conditionFunction(actualValue == null ? '' : actualValue.toString(), condition.fieldValue);
  }

  private normalizeOperator(operator: number | string | null | undefined): string {
    switch (String(operator ?? 'Equals')) {
      case '3':
      case 'NotEquals':
        return 'NotEquals';
      case '0':
      case 'Contains':
        return 'Contains';
      case '1':
      case 'NotContains':
        return 'NotContains';
      case '4':
      case 'MatchRegularExpression':
        return 'MatchRegularExpression';
      case '2':
      case 'Equals':
      default:
        return 'Equals';
    }
  }

  private normalizeConditionCombination(conditionCombination: number | string | undefined): string {
    switch (String(conditionCombination ?? 'All').toLowerCase()) {
      case '0':
      case 'or':
      case 'any':
        return ConditionCombinationType.Any;
      default:
        return ConditionCombinationType.All;
    }
  }

  private normalizeSatisfiedAction(satisfiedAction: string | undefined): string {
    const normalized = String(satisfiedAction ?? '').toLowerCase();
    return normalized.includes('hide') ? 'hide' : 'show';
  }

  private fieldLabel(field: EpiserverFieldDefinitionLike): string {
    return field.name || field.properties.label || field.properties.Label || field.editViewFriendlyTitle || this.fieldKey(field);
  }

  private fieldId(field: EpiserverFieldDefinitionLike): number | undefined {
    if (typeof field.id === 'number') {
      return field.id;
    }

    if (typeof field.properties.contentLinkId === 'number') {
      return field.properties.contentLinkId;
    }

    if (typeof field.contentLink?.id === 'number') {
      return field.contentLink.id;
    }

    return undefined;
  }

  private fieldKey(field: EpiserverFieldDefinitionLike): string {
    return field.key || field.contentGuid || '';
  }
}
