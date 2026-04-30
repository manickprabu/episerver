import { Injectable } from '@angular/core';
import { DynamicEpiServerField, DynamicEpiServerForm } from '../models/dynamic-episerver-form.model';
import { FormField, FormFieldValidator, FormSchema } from '../models/form-schema.model';

@Injectable()
export class DynamicFormAdapterService {
  adaptForm(source: DynamicEpiServerForm): FormSchema {
    return {
      key: source.contentGuid,
      locale: 'en',
      localizations: {},
      steps: [],
      properties: {
        title: source.name,
        allowToStoreSubmissionData: true,
        showSummarizedData: false,
        confirmationMessage: '',
        resetConfirmationMessage: '',
        redirectToPage: '',
        submitSuccessMessage: 'Thanks, your form has been submitted.',
        allowAnonymousSubmission: true,
        allowMultipleSubmission: true,
        showNavigationBar: true,
        description: '',
        metadataAttribute: '',
        focusOnForm: true
      },
      formElements: [...this.mapHiddenFields(source), ...source.fields.map((field) => this.mapField(field))]
    };
  }

  initialSubmissionKey(source: DynamicEpiServerForm): string {
    return source.hidden?.['__FormSubmissionId'] ?? '';
  }

  private mapHiddenFields(source: DynamicEpiServerForm): FormField[] {
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

  private mapField(field: DynamicEpiServerField): FormField {
    const contentType = this.normalizeContentType(field.type);
    const validators = this.mapValidators(field.properties.Validators, field.properties.ValidatorMessages);

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
        predefinedValue: field.properties.DefaultValue as string | undefined,
        paragraphText: field.properties.ParagraphText as string | undefined,
        allowMultiSelect: Boolean(field.properties.AllowMultiSelect),
        allowMultiple: Boolean(field.properties.AllowMultiple),
        finalizeForm: field.properties.FinalizeForm as boolean | undefined,
        redirectToPage: field.properties.RedirectToPage as string | undefined,
        attachedContentLink: field.properties.AttachedContentLink as string | undefined,
        items: field.properties.Items?.map((item) => ({
          caption: item.caption,
          value: item.value,
          checked: Boolean(item.checked)
        })),
        validators
      } as unknown as FormField['properties']
    };
  }

  private normalizeContentType(type: string): string {
    return type.replace(/Proxy$/, '');
  }

  private mapValidators(validators: string | undefined, messages: Array<{ validator: string; message: string }> | undefined): FormFieldValidator[] {
    if (!validators) {
      return [];
    }

    return validators
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => {
        const type = value.split('.').pop() ?? value;
        const message = messages?.find((item) => item.validator === value || item.validator.endsWith(type))?.message;

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
