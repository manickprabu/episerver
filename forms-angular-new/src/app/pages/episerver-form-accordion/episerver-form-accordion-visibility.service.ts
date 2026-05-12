import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, startWith } from 'rxjs/operators';

import {
  EpiserverFieldCondition,
  EpiserverFieldDefinition,
  FieldDependencyEvaluation,
  FieldVisibilityState
} from '../../episerver-forms/models/episerver-form-definition.model';

@Injectable({ providedIn: 'root' })
export class EpiserverFormAccordionVisibilityService {
  private readonly defaultVisibleState: FieldVisibilityState = {
    visibilityByGuid: {},
    visibilityByContentLinkId: {},
    evaluations: []
  };

  watchVisibility(fields: EpiserverFieldDefinition[], formGroup: FormGroup): Observable<FieldVisibilityState> {
    return formGroup.valueChanges.pipe(
      startWith(formGroup.getRawValue()),
      map((values) => this.evaluateFieldVisibility(fields, values as Record<string, unknown>)),
      distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  evaluateFieldVisibility(
    fields: EpiserverFieldDefinition[] | null | undefined,
    valuesByGuid: Record<string, unknown> | null | undefined
  ): FieldVisibilityState {
    if (!fields?.length) {
      return this.defaultVisibleState;
    }

    const safeValues = valuesByGuid ?? {};
    const fieldsByContentLinkId = new Map<number, EpiserverFieldDefinition>();
    fields.forEach((field) => {
      if (typeof field.contentLink?.id === 'number') {
        fieldsByContentLinkId.set(field.contentLink.id, field);
      }
    });

    const visibilityCache = new Map<string, boolean>();
    const evaluations: FieldDependencyEvaluation[] = [];
    const visibilityByGuid: Record<string, boolean> = {};
    const visibilityByContentLinkId: Record<number, boolean> = {};

    fields.forEach((field) => {
      const visible = this.evaluateFieldVisibilityInternal(
        field,
        fieldsByContentLinkId,
        safeValues,
        visibilityCache,
        new Set<string>(),
        evaluations
      );

      visibilityByGuid[field.contentGuid] = visible;
      if (typeof field.contentLink?.id === 'number') {
        visibilityByContentLinkId[field.contentLink.id] = visible;
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

  private normalizeValue(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map((item) => String(item));
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (value === null || value === undefined || value === '') {
      return [];
    }

    return [String(value)];
  }

  private combineConditionResults(results: boolean[], combination: number | string | undefined): boolean {
    if (results.length === 0) {
      return true;
    }

    const normalized = String(combination ?? '').toLowerCase();
    if (normalized === '0' || normalized === 'or' || normalized === 'any') {
      return results.some(Boolean);
    }

    return results.every(Boolean);
  }

  private hasShowAction(field: EpiserverFieldDefinition): boolean {
    const action = String(field.properties.SatisfiedAction ?? '').toLowerCase();
    return !action || action.includes('showaction');
  }

  private fieldLabel(field: EpiserverFieldDefinition): string {
    return field.name || field.properties.Label || field.editViewFriendlyTitle || field.contentGuid;
  }

  private evaluateCondition(
    condition: EpiserverFieldCondition,
    fieldsByContentLinkId: Map<number, EpiserverFieldDefinition>,
    valuesByGuid: Record<string, unknown>,
    visibilityCache: Map<string, boolean>,
    visiting: Set<string>
  ): { matches: boolean; evaluation: FieldDependencyEvaluation | null } {
    const sourceFieldId = condition.field?.id;
    const expectedValue = condition.fieldValue ?? '';

    if (typeof sourceFieldId !== 'number') {
      return { matches: false, evaluation: null };
    }

    const sourceField = fieldsByContentLinkId.get(sourceFieldId);
    if (!sourceField) {
      return {
        matches: false,
        evaluation: {
          dependentFieldId: -1,
          dependentFieldName: '',
          sourceFieldId,
          sourceFieldName: 'Unknown source field',
          selectedValue: undefined,
          expectedValue: String(expectedValue),
          visible: false
        }
      };
    }

    const selectedValue = valuesByGuid[sourceField.contentGuid];
    const sourceVisible = this.evaluateFieldVisibilityInternal(
      sourceField,
      fieldsByContentLinkId,
      valuesByGuid,
      visibilityCache,
      visiting,
      []
    );
    const matches = sourceVisible && this.normalizeValue(selectedValue).includes(String(expectedValue));

    return {
      matches,
      evaluation: {
        dependentFieldId: -1,
        dependentFieldName: '',
        sourceFieldId,
        sourceFieldName: this.fieldLabel(sourceField),
        selectedValue,
        expectedValue: String(expectedValue),
        visible: matches
      }
    };
  }

  private evaluateFieldVisibilityInternal(
    field: EpiserverFieldDefinition,
    fieldsByContentLinkId: Map<number, EpiserverFieldDefinition>,
    valuesByGuid: Record<string, unknown>,
    visibilityCache: Map<string, boolean>,
    visiting: Set<string>,
    evaluations: FieldDependencyEvaluation[]
  ): boolean {
    if (visibilityCache.has(field.contentGuid)) {
      return visibilityCache.get(field.contentGuid) ?? true;
    }

    if (visiting.has(field.contentGuid)) {
      return false;
    }

    const conditions = field.properties.Conditions ?? [];
    if (conditions.length === 0) {
      visibilityCache.set(field.contentGuid, true);
      return true;
    }

    visiting.add(field.contentGuid);

    const conditionResults = conditions.map((condition) => {
      const result = this.evaluateCondition(condition, fieldsByContentLinkId, valuesByGuid, visibilityCache, visiting);

      if (result.evaluation) {
        evaluations.push({
          ...result.evaluation,
          dependentFieldId: field.contentLink?.id ?? -1,
          dependentFieldName: this.fieldLabel(field)
        });
      }

      return result.matches;
    });

    const visible = this.hasShowAction(field) && this.combineConditionResults(conditionResults, field.properties.ConditionCombination);
    visibilityCache.set(field.contentGuid, visible);
    visiting.delete(field.contentGuid);
    return visible;
  }
}
