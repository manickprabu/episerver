import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { FormSubmission, FormSubmitModel } from '../../episerver-forms/episerver-sdk';
import { EpiserverFormDefinition } from '../../episerver-forms/models/episerver-form-definition.model';
import { FormSubmissionResult } from '../../episerver-forms/models/form-schema.model';

const DEBUG_EPISERVER_FORM: EpiserverFormDefinition = {
  "formId": "38087b68-9215-4af8-9463-4d62850666ed",
  "contentGuid": "38087b68-9215-4af8-9463-4d62850666ed",
  "name": "FreeholdPIF",
  "totalSteps": 1,
  "fields": [
    {
      "name": "Title",
      "contentLink": {
        "id": 31804,
        "workID": 0,
        "providerName": null,
        "getPublishedOrLatest": false,
        "isExternalProvider": false,
        "isReadOnly": true
      },
      "contentGuid": "72a7ce07-29b5-4b07-92bf-ea02d9c0eb06",
      "editViewFriendlyTitle": "Hidden predefined value: (About My Home)",
      "type": "PredefinedHiddenElementBlockProxy",
      "properties": {
        "PredefinedValue": "About My Home"
      }
    },
    {
      "name": "Who lives at the property?",
      "contentLink": {
        "id": 31794,
        "workID": 0,
        "providerName": null,
        "getPublishedOrLatest": false,
        "isExternalProvider": false,
        "isReadOnly": true
      },
      "contentGuid": "91f3398a-1244-4da3-828f-9eda5fa03417",
      "editViewFriendlyTitle": "Text",
      "type": "TextboxElementBlockProxy",
      "properties": {
        "Label": "Who lives at the property? Please include all persons aged 17 or over",
        "Validators": "EPiServer.Forms.Implementation.Validation.RequiredValidator",
        "ValidatorMessages": [
          {
            "validator": "EPiServer.Forms.Implementation.Validation.RequiredValidator",
            "message": "This field is required."
          }
        ],
        "Conditions": []
      }
    },
    {
      "name": "What is the tenure type of the property",
      "contentLink": {
        "id": 31795,
        "workID": 0,
        "providerName": null,
        "getPublishedOrLatest": false,
        "isExternalProvider": false,
        "isReadOnly": true
      },
      "contentGuid": "be6fd850-f5c6-45e0-9487-66dfafa62a74",
      "editViewFriendlyTitle": "Selection",
      "type": "SelectionElementBlockProxy",
      "properties": {
        "Label": "What is the tenure type of the property? (please select your answer)",
        "Validators": "EPiServer.Forms.Implementation.Validation.RequiredValidator",
        "Feed": "FormsFeed_UseManualInput",
        "Items": [
          {
            "caption": "Freehold",
            "value": "Freehold",
            "checked": false
          },
          {
            "caption": "Leasehold",
            "value": "Leasehold",
            "checked": false
          },
          {
            "caption": "Share of freehold",
            "value": "Share of freehold",
            "checked": false
          },
          {
            "caption": "Feudal",
            "value": "Feudal",
            "checked": false
          },
          {
            "caption": "Unknown",
            "value": "Unknown",
            "checked": false
          }
        ],
        "ValidatorMessages": [
          {
            "validator": "EPiServer.Forms.Implementation.Validation.RequiredValidator",
            "message": "This field is required."
          }
        ],
        "Conditions": []
      }
    },
    {
      "name": "Did you buy the property on a shared ownership scheme",
      "contentLink": {
        "id": 31796,
        "workID": 0,
        "providerName": null,
        "getPublishedOrLatest": false,
        "isExternalProvider": false,
        "isReadOnly": true
      },
      "contentGuid": "b2c5e535-8c79-4c92-9ef4-93aee94a8597",
      "editViewFriendlyTitle": "Selection",
      "type": "SelectionElementBlockProxy",
      "properties": {
        "Label": "Did you buy the property on a shared ownership scheme or other discounted or low cost housing scheme? (please select your answer)   If yes, please state the percentage share being sold ",
        "Validators": "EPiServer.Forms.Implementation.Validation.RequiredValidator",
        "Feed": "FormsFeed_UseManualInput",
        "Items": [
          {
            "caption": "Yes",
            "value": "Yes",
            "checked": false
          },
          {
            "caption": "No",
            "value": "No",
            "checked": false
          },
          {
            "caption": "Not known",
            "value": "Not known",
            "checked": false
          }
        ],
        "ValidatorMessages": [
          {
            "validator": "EPiServer.Forms.Implementation.Validation.RequiredValidator",
            "message": "This field is required."
          }
        ],
        "Conditions": []
      }
    },
    {
      "name": "Shared Ownership (Yes TextArea)",
      "contentLink": {
        "id": 31799,
        "workID": 0,
        "providerName": null,
        "getPublishedOrLatest": false,
        "isExternalProvider": false,
        "isReadOnly": true
      },
      "contentGuid": "44599ec0-e79a-423b-9ebb-8af824abc69e",
      "editViewFriendlyTitle": "Text area",
      "type": "TextareaElementBlockProxy",
      "properties": {
        "Label": "Please state the percentage share being sold",
        "Validators": "EPiServer.Forms.Implementation.Validation.RequiredValidator",
        "ValidatorMessages": [
          {
            "validator": "EPiServer.Forms.Implementation.Validation.RequiredValidator",
            "message": "This field is required."
          }
        ],
        "SatisfiedAction": "EPiServer.Forms.Core.Internal.Dependency.ShowAction",
        "ConditionCombination": 1,
        "Conditions": [
          {
            "field": {
              "id": 31796,
              "workID": 0,
              "providerName": null,
              "getPublishedOrLatest": false,
              "isExternalProvider": false,
              "isReadOnly": false
            },
            "operator": 2,
            "fieldValue": "Yes"
          }
        ]
      }
    },
    {
      "name": "Seller Type",
      "contentLink": {
        "id": 31800,
        "workID": 0,
        "providerName": null,
        "getPublishedOrLatest": false,
        "isExternalProvider": false,
        "isReadOnly": true
      },
      "contentGuid": "6b8387ba-4850-4b14-a2cd-9cb349c19754",
      "editViewFriendlyTitle": "Seller Type",
      "type": "FormStepBlockProxy",
      "properties": {
        "Label": "Seller Type"
      }
    },
    {
      "name": "Title",
      "contentLink": {
        "id": 31805,
        "workID": 0,
        "providerName": null,
        "getPublishedOrLatest": false,
        "isExternalProvider": false,
        "isReadOnly": true
      },
      "contentGuid": "af70e167-1d4d-44a1-9a6f-3a7660096abd",
      "editViewFriendlyTitle": "Hidden predefined value: (Seller Type)",
      "type": "PredefinedHiddenElementBlockProxy",
      "properties": {
        "PredefinedValue": "Seller Type"
      }
    },
    {
      "name": "Is the property a probate sale, in receivership, held by a Trust or owned by a developer?",
      "contentLink": {
        "id": 31801,
        "workID": 0,
        "providerName": null,
        "getPublishedOrLatest": false,
        "isExternalProvider": false,
        "isReadOnly": true
      },
      "contentGuid": "cb818013-6cf8-409c-aff7-e0d599b431a9",
      "editViewFriendlyTitle": "Selection",
      "type": "SelectionElementBlockProxy",
      "properties": {
        "Label": "Is the property a probate sale, in receivership, held by a Trust or owned by a developer? If you have difficulty completing this form due to one of these reasons, please contact us directly.  (please select your answer) ",
        "Validators": "EPiServer.Forms.Implementation.Validation.RequiredValidator",
        "Feed": "FormsFeed_UseManualInput",
        "Items": [
          {
            "caption": "Yes",
            "value": "Yes",
            "checked": false
          },
          {
            "caption": "No",
            "value": "No",
            "checked": false
          }
        ],
        "ValidatorMessages": [
          {
            "validator": "EPiServer.Forms.Implementation.Validation.RequiredValidator",
            "message": "This field is required."
          }
        ],
        "Conditions": []
      }
    },
    {
      "name": "Seller Type (Yes)",
      "contentLink": {
        "id": 31802,
        "workID": 0,
        "providerName": null,
        "getPublishedOrLatest": false,
        "isExternalProvider": false,
        "isReadOnly": true
      },
      "contentGuid": "e3085a78-5fb8-4736-ae5b-94d5d4ed7763",
      "editViewFriendlyTitle": "Text area",
      "type": "TextareaElementBlockProxy",
      "properties": {
        "Label": "Please specify which",
        "Validators": "EPiServer.Forms.Implementation.Validation.RequiredValidator",
        "ValidatorMessages": [
          {
            "validator": "EPiServer.Forms.Implementation.Validation.RequiredValidator",
            "message": "This field is required."
          }
        ],
        "SatisfiedAction": "EPiServer.Forms.Core.Internal.Dependency.ShowAction",
        "ConditionCombination": 1,
        "Conditions": [
          {
            "field": {
              "id": 31801,
              "workID": 0,
              "providerName": null,
              "getPublishedOrLatest": false,
              "isExternalProvider": false,
              "isReadOnly": false
            },
            "operator": 2,
            "fieldValue": "Yes"
          }
        ]
      }
    },
    {
      "name": "Submit button",
      "contentLink": {
        "id": 31803,
        "workID": 0,
        "providerName": null,
        "getPublishedOrLatest": false,
        "isExternalProvider": false,
        "isReadOnly": true
      },
      "contentGuid": "5fd75c5e-75f0-4cfc-a589-7b0b148c3747",
      "editViewFriendlyTitle": "Submit button",
      "type": "SubmitButtonElementBlockProxy",
      "properties": {
        "Label": "Save & Exit",
        "Conditions": []
      }
    }
  ],
  "hidden": {
    "__FormGuid": "38087b68-9215-4af8-9463-4d62850666ed",
    "__FormSubmissionId": "bead1f8c-6b9c-4dde-9f4f-e34f2a4d7a1c"
  },
  "antiforgery": {
    "token": "CfDJ8AAa_RkF7odDpC0yc3-aIslZ6EM_nJAg9KfFLNhnWj5UGzCblIYCoQt8aQsGD-9o2h07hLQJMHgBKr2eVbrIQ6QAIEPRV6rwOkHvpDsm2mCgrZGTHL_b9qKgeXitF3dj6WXtPquhEQ09aJ3WSMU2k2SBSTLA3ZYPctVsjitfVFEYSfVpbNp6M6A1Le_UEG4rjQ",
    "headerName": "RequestVerificationToken"
  }
};

@Injectable({ providedIn: 'root' })
export class EpiserverFormAccordionService {
  readonly endpoint = 'http://localhost:8000/test-episerver-form';
  readonly debug = true;

  constructor(private readonly httpClient: HttpClient) {}

  loadForm(): Observable<EpiserverFormDefinition> {
    if (this.debug) {
      return of(this.cloneForm(DEBUG_EPISERVER_FORM));
    }

    return this.httpClient.get<EpiserverFormDefinition>(this.endpoint);
  }

  savePartial(source: EpiserverFormDefinition, model: FormSubmitModel): Observable<FormSubmissionResult> {
    return this.httpClient.post<FormSubmissionResult>(this.endpoint, this.toFormData(source, model), {
      headers: this.buildHeaders(source)
    });
  }

  submitFinal(source: EpiserverFormDefinition, model: FormSubmitModel): Observable<FormSubmissionResult> {
    return this.httpClient.put<FormSubmissionResult>(this.endpoint, this.toFormData(source, model), {
      headers: this.buildHeaders(source)
    });
  }

  private buildHeaders(source: EpiserverFormDefinition): HttpHeaders | undefined {
    const antiforgery = source.antiforgery;
    if (!antiforgery) {
      return undefined;
    }

    return new HttpHeaders({ [antiforgery.headerName]: antiforgery.token });
  }

  private toFormData(source: EpiserverFormDefinition, model: FormSubmitModel): FormData {
    const formData = new FormData();
    const fields: Record<string, unknown> = {};
    const fieldKeyMap = this.buildFieldKeyMap(source);

    model.submissionData.forEach((submission: FormSubmission) => {
      const serializedKey = fieldKeyMap.get(submission.elementKey) ?? submission.elementKey;
      const value = submission.value;
      if (value === null || value === undefined || value === '') {
        return;
      }

      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        const files = value as Array<{ name: string; file?: File }>;
        let fileNames = '';

        for (let index = 0; index < files.length; index += 1) {
          const file = files[index].file;
          if (file) {
            formData.append(serializedKey + '_file_' + index, file);
          }

          if (index > 0) {
            fileNames += ' | ';
          }
          fileNames += files[index].name;
        }

        fields[serializedKey] = fileNames;
        return;
      }

      fields[serializedKey] = value;
    });

    formData.append(
      'data',
      JSON.stringify({
        FormKey: model.formKey,
        Locale: model.locale,
        IsFinalized: model.isFinalized,
        SubmissionKey: model.partialSubmissionKey,
        HostedPageUrl: model.hostedPageUrl,
        CurrentStep: model.currentStepIndex,
        Fields: fields
      })
    );

    return formData;
  }

  private buildFieldKeyMap(source: EpiserverFormDefinition): Map<string, string> {
    const map = new Map<string, string>();

    source.fields.forEach((field) => {
      if (typeof field.contentLink?.id === 'number') {
        map.set(field.contentGuid, '__field_' + field.contentLink.id);
      }
    });

    return map;
  }

  private cloneForm(source: EpiserverFormDefinition): EpiserverFormDefinition {
    return JSON.parse(JSON.stringify(source)) as EpiserverFormDefinition;
  }
}
