import { Injectable } from '@angular/core';
import { DynamicEpiServerField, DynamicEpiServerForm } from '../models/dynamic-episerver-form.model';
import { FormField, FormFieldValidator, FormSchema } from '../models/form-schema.model';

@Injectable({
  providedIn: 'root'
})
export class DynamicFormAdapterService {
  adaptForm(source: DynamicEpiServerForm): FormSchema {
    return {
      key: source.contentGuid,
      properties: {
        title: source.name,
        showNavigationBar: true,
        allowAnonymousSubmission: true,
        submitSuccessMessage: 'Thanks, your form has been submitted.',
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
      properties: {
        label: key,
        defaultValue: value
      }
    }));
  }

  private mapField(field: DynamicEpiServerField): FormField {
    const contentType = this.normalizeContentType(field.type);
    const validators = this.mapValidators(field.properties.Validators, field.properties.ValidatorMessages);

    return {
      key: field.contentGuid,
      contentType,
      displayName: field.editViewFriendlyTitle,
      properties: {
        label: field.properties.Label ?? field.editViewFriendlyTitle,
        description: field.properties.Description,
        placeHolder: field.properties.PlaceHolder,
        autoComplete: field.properties.AutoComplete,
        defaultValue: field.properties.DefaultValue,
        paragraphText: field.properties.ParagraphText,
        allowMultiSelect: Boolean(field.properties.AllowMultiSelect),
        allowMultiple: Boolean(field.properties.AllowMultiple),
        finalizeForm: field.properties.FinalizeForm as boolean | undefined,
        redirectToPage: field.properties.RedirectToPage as string | undefined,
        attachedContentLink: field.properties.AttachedContentLink as string | undefined,
        items: field.properties.Items?.map((item) => ({
          caption: item.caption,
          value: item.value,
          checked: item.checked
        })),
        validators
      }
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
          model: {
            message
          }
        };
      });
  }
}
