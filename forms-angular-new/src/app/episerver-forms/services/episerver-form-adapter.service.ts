import { Injectable } from '@angular/core';
import { EpiserverFieldDefinition, EpiserverFormDefinition } from '../models/episerver-form-definition.model';
import { ConditionCombinationType, ConditionFunctionType, SatisfiedActionType } from '../episerver-sdk';
import { FormField, FormFieldValidator, FormSchema } from '../models/form-schema.model';

@Injectable()
export class EpiserverFormAdapterService {
  adaptForm(source: EpiserverFormDefinition): FormSchema {
    const sourceFieldKeyById = this.buildSourceFieldKeyById(source.fields);

    return {
      key: source.contentGuid,
      locale: 'en',
      localizations: {},
      steps: [],
      properties: {
        title: source.title || source.name,
        allowToStoreSubmissionData: true,
        showSummarizedData: false,
        confirmationMessage: '',
        resetConfirmationMessage: '',
        redirectToPage: '',
        submitSuccessMessage: 'Thanks, your form has been submitted.',
        allowAnonymousSubmission: true,
        allowMultipleSubmission: true,
        showNavigationBar: true,
        description: source.description || '',
        metadataAttribute: '',
        focusOnForm: true
      },
      formElements: [...this.mapHiddenFields(source), ...source.fields.map(field => this.mapField(field, sourceFieldKeyById))]
    };
  }

  initialSubmissionKey(source: EpiserverFormDefinition): string {
    return source.submissionId ?? source.hidden?.['__FormSubmissionId'] ?? '';
  }

  private mapHiddenFields(source: EpiserverFormDefinition): FormField[] {
    return Object.entries(source.hidden ?? {}).map(([key, value]) => ({
      key,
      contentType: 'PredefinedHiddenElementBlock',
      displayName: key,
      localizations: {},
      locale: 'en',
      properties: {
        label: key,
        description: '',
        predefinedValue: String(value)
      }
    }));
  }

  private mapField(field: EpiserverFieldDefinition, sourceFieldKeyById: Map<number, string>): FormField {
    const contentType = this.normalizeContentType(field.type);
    const validators = this.mapValidators(field.properties.Validators, field.properties.ValidatorMessages);
    const conditions = this.mapConditions(field, sourceFieldKeyById);
    const satisfiedAction = this.normalizeSatisfiedAction(field.properties.SatisfiedAction);
    const conditionCombination = this.normalizeConditionCombination(field.properties.ConditionCombination);

    return {
      key: field.contentGuid,
      contentType,
      displayName: field.editViewFriendlyTitle ?? field.contentGuid,
      localizations: {},
      locale: 'en',
      properties: {
        label: field.properties.Label ?? field.editViewFriendlyTitle ?? field.contentGuid,
        description: field.properties.Description ?? '',
        placeHolder: field.properties.PlaceHolder,
        autoComplete: field.properties.AutoComplete,
        predefinedValue: (field.value ?? field.properties.DefaultValue) as string | undefined,
        readOnly: Boolean(field.contentLink?.isReadOnly ?? field.properties['ReadOnly'] ?? field.properties['IsReadOnly']),
        disabled: Boolean(field.properties['Disabled']),
        paragraphText: field.properties.ParagraphText as string | undefined,
        allowMultiSelect: Boolean(field.properties.AllowMultiSelect),
        allowMultiple: Boolean(field.properties.AllowMultiple),
        finalizeForm: field.properties.FinalizeForm as boolean | undefined,
        redirectToPage: field.properties.RedirectToPage as string | undefined,
        attachedContentLink: field.properties.AttachedContentLink as string | undefined,
        contentLinkId: field.contentLink?.id ?? field.id,
        items: field.properties.Items?.map(item => ({
          caption: item.caption,
          value: item.value,
          checked: Boolean(item.checked)
        })),
        validators,
        conditions,
        conditionCombination,
        satisfiedAction
      } as unknown as FormField['properties']
    };
  }

  private buildSourceFieldKeyById(fields: EpiserverFieldDefinition[]): Map<number, string> {
    const sourceFieldKeyById = new Map<number, string>();

    for (const field of fields) {
      const ids = [field.contentLink?.id, field.id].filter((id): id is number => typeof id === 'number');
      for (const id of ids) {
        sourceFieldKeyById.set(id, field.contentGuid);
      }
    }

    return sourceFieldKeyById;
  }

  private mapConditions(field: EpiserverFieldDefinition, sourceFieldKeyById: Map<number, string>) {
    return (field.properties.Conditions ?? [])
      .map(condition => {
        const sourceFieldId = condition.field?.id;
        if (typeof sourceFieldId !== 'number') {
          return null;
        }

        const sourceFieldKey = sourceFieldKeyById.get(sourceFieldId);
        if (!sourceFieldKey) {
          return null;
        }

        return {
          field: sourceFieldKey,
          operator: this.normalizeOperator(condition.operator),
          fieldValue: condition.fieldValue ?? ''
        };
      })
      .filter((condition): condition is { field: string; operator: string; fieldValue: string } => condition !== null);
  }

  private normalizeContentType(type: string): string {
    return type.replace(/Proxy$/, '');
  }

  private normalizeOperator(operator: number | string | null | undefined): string {
    switch (operator) {
      case 0:
      case '0':
      case 'Contains':
        return ConditionFunctionType.Contains;
      case 1:
      case '1':
      case 'NotContains':
        return ConditionFunctionType.NotContains;
      case 2:
      case '2':
      case 'Equals':
        return ConditionFunctionType.Equals;
      case 3:
      case '3':
      case 'NotEquals':
        return ConditionFunctionType.NotEquals;
      case 4:
      case '4':
      case 'MatchRegularExpression':
        return ConditionFunctionType.MatchRegularExpression;
      default:
        return ConditionFunctionType.Equals;
    }
  }

  private normalizeConditionCombination(conditionCombination: number | string | undefined): string {
    switch (conditionCombination) {
      case 0:
      case '0':
      case 'Any':
      case 'OR':
      case 'Or':
        return ConditionCombinationType.Any;
      default:
        return ConditionCombinationType.All;
    }
  }

  private normalizeSatisfiedAction(satisfiedAction: unknown): string {
    switch (String(satisfiedAction ?? '').toLowerCase()) {
      case 'hide':
        return SatisfiedActionType.Hide;
      case 'show':
      default:
        return SatisfiedActionType.Show;
    }
  }

  private mapValidators(validators: string | undefined, messages: Array<{ validator: string; message: string }> | undefined): FormFieldValidator[] {
    if (!validators) {
      return [];
    }

    return validators
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)
      .map(value => {
        const type = value.split('.').pop() ?? value;
        const message = messages?.find(item => item.validator === value || item.validator.endsWith(type))?.message;

        return {
          type,
          validationOrder: 0,
          description: type,
          model: {
            message: message ?? '',
            validationCssClass: '',
            additionalAttributes: {}
          }
        };
      });
  }
}
