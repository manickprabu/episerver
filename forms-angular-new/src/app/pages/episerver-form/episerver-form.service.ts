import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { FormSubmission, FormSubmitModel } from '../../episerver-forms/episerver-sdk';
import { EpiserverFormDefinition } from '../../episerver-forms/models/episerver-form-definition.model';
import { FormSubmissionResult } from '../../episerver-forms/models/form-schema.model';

const DEBUG_EPISERVER_FORM: EpiserverFormDefinition = {
  title: 'Property Information Form',
  description:
    'In accordance with the Digital Markets, Competition and Consumers Act 2024, it is essential that the property information you provide to us - whether verbally or in writing - is accurate and factually correct.\n\nTo assist us in meeting these obligations, please complete the following questions to the best of your knowledge. We appreciate that some questions may not apply to your property. In our experience, the sales process tends to progress more smoothly when prospective buyers are presented with clear and accurate information from the outset.',
  formGuid: '38087b68-9215-4af8-9463-4d62850666ed',
  contentGuid: '38087b68-9215-4af8-9463-4d62850666ed',
  name: 'Freehold Property Information Form',
  isFinalised:false,
  totalSteps: 5,
  fields: [
    {
      name: 'Title',
      id: 31805,
      contentGuid: 'af70e167-1d4d-44a1-9a6f-3a7660096abd',
      editViewFriendlyTitle: 'Hidden predefined value: (Type of Seller)',
      type: 'PredefinedHiddenElementBlockProxy',
      value: '',
      properties: {
        PredefinedValue: 'Type of Seller'
      }
    },
    {
            "name": "Number",
            "id": 31826,
            "contentGuid": "a12817e2-019c-445a-b219-cff2842be0fb",
            "editViewFriendlyTitle": "Number",
            "type": "NumberElementBlockProxy",
            "value": "",
            "properties": {
                "Label": "Number",
                "Validators": "EPiServer.Forms.Implementation.Validation.RequiredValidator|||EPiServer.Forms.Implementation.Validation.IntegerValidator|||EPiServer.Forms.Implementation.Validation.PositiveIntegerValidator",
                "PlaceHolder": "Int",
                "ValidatorMessages": [
                    {
                        "validator": "EPiServer.Forms.Implementation.Validation.PositiveIntegerValidator",
                        "message": "Enter a valid positive integer."
                    },
                    {
                        "validator": "EPiServer.Forms.Implementation.Validation.IntegerValidator",
                        "message": "Enter a valid integer."
                    },
                    {
                        "validator": "EPiServer.Forms.Implementation.Validation.RequiredValidator",
                        "message": "This field is required."
                    }
                ],
                "Conditions": []
            }
        },
        {
            "name": "Date time",
            "id": 31827,
            "contentGuid": "6c4c9200-6ca9-445a-b114-ae347bec5fbe",
            "editViewFriendlyTitle": "Date time",
            "type": "DateTimeElementBlockProxy",
            "value": "",
            "properties": {
                "Label": "Date time",
                "Conditions": []
            }
        },
        {
            "name": "Multiple or single choice",
            "id": 31829,
            "contentGuid": "247c5155-e63a-43b5-bf76-44ce9ca5d3e4",
            "editViewFriendlyTitle": "Multiple or single choice",
            "type": "ChoiceElementBlockProxy",
            "value": "",
            "properties": {
                "Label": "Multiple or single choice",
                "Feed": "FormsFeed_UseManualInput",
                "Items": [
                  {
            caption: 'this property.',
            value: 'Disclaimer',
            checked: false
          },{
            caption: '2By firm ners of this property.',
            value: 'Disclaimer2',
            checked: false
          },{
            caption: '3By submitting this , ',
            value: 'Disclaimer3',
            checked: false
          }
                ],
                "Conditions": []
            }
        },
        {
            "name": "File upload",
            "id": 311828,
            "contentGuid": "d9d1c0b7-1d48-4a17-bb2b-77c17de3b3e2",
            "editViewFriendlyTitle": "File upload",
            "type": "FileUploadElementBlockProxy",
            "value": "[{\"DownloadUrl\":\"/globalassets/forms-upload-assets/demo-test2.pdf\",\"Name\":\"demo-test.pdf\"}]",
            "properties": {
                "Label": "File upload",
                "AllowMultiple":true,
                "FileSize":5,
                "FileTypes":'pdf, png',
                "Conditions": []
            }
        },

        {
            "name": "File upload",
            "id": 318228,
            "contentGuid": "d9d1c0b7-1d48-4a17-bb2b-77c17de3b3edd2",
            "editViewFriendlyTitle": "File upload 2",
            "type": "FileUploadElementBlockProxy",
            "value": "",
            "properties": {
                "Label": "File upload 2",
                "AllowMultiple":true,
                "FileSize":3,
                "FileTypes":'jpg, pdf, png',
                "Conditions": []
            }
        },
    {
      name: 'Is the property a probate sale, in receivership, held by a Trust or owned by a developer?',
      id: 31801,
      contentGuid: 'cb818013-6cf8-409c-aff7-e0d599b431a9',
      editViewFriendlyTitle: 'Selection',
      type: 'SelectionElementBlockProxy',
      value: 'Yes',
      properties: {
        Label: 'Is the property a probate sale, in receivership, held by a Trust or owned by a developer? If you have difficulty completing this form due to one of these reasons, please contact us directly.  (please select your answer) ',
        Validators: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
        Feed: 'FormsFeed_UseManualInput',
        Items: [
          {
            caption: 'Yes',
            value: 'Yes',
            checked: false
          },
          {
            caption: 'No',
            value: 'No',
            checked: false
          },{
            caption: 'N2o',
            value: 'N2o',
            checked: false
          }, {
            caption: 'Nddo',
            value: 'Nddo',
            checked: false
          }, {
            caption: 'cNo',
            value: 'Nco',
            checked: false
          }, {
            caption: 'Nqo',
            value: 'Nqo',
            checked: false
          }, {
            caption: 'Nto',
            value: 'Ngo',
            checked: false
          }
        ],
        ValidatorMessages: [
          {
            validator: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
            message: 'This ONE field is required.'
          }
        ],
        Conditions: []
      }
    },
    {
      name: 'Seller Type (Yes)',
      id: 31802,
      contentGuid: 'e3085a78-5fb8-4736-ae5b-94d5d4ed7763',
      editViewFriendlyTitle: 'Text area',
      type: 'TextareaElementBlockProxy',
      value: '',
      properties: {
        Label: 'Please specify which',
        Validators: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
        ValidatorMessages: [
          {
            validator: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
            message: 'This field is required.'
          }
        ],
        SatisfiedAction: 'EPiServer.Forms.Core.Internal.Dependency.ShowAction',
        ConditionCombination: 1,
        Conditions: [
          {
            field: {
              id: 31801,
              workID: 0,
              providerName: null,
              getPublishedOrLatest: false,
              isExternalProvider: false,
              isReadOnly: false
            },
            operator: 2,
            fieldValue: 'Yes'
          }
        ]
      }
    },
    {
      name: 'About my home',
      id: 31800,
      contentGuid: '6b8387ba-4850-4b14-a2cd-9cb349c19754',
      editViewFriendlyTitle: 'About my home',
      type: 'FormStepBlockProxy',
      value: '',
      properties: {
        Label: 'About my home',
        Description: 'Some description to explain about my home that benefits the user'
      }
    },
    {
      name: 'Who lives at the property?',
      id: 31794,
      contentGuid: '91f3398a-1244-4da3-828f-9eda5fa03417',
      editViewFriendlyTitle: 'Text',
      type: 'TextboxElementBlockProxy',
      value: '3',
      properties: {
        Label: 'Who lives at the property? Please include all persons aged 17 or over',
        Validators: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
        ValidatorMessages: [
          {
            validator: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
            message: 'This field is required.'
          }
        ],
        Conditions: []
      }
    },
    {
      name: 'What is the tenure type of the property',
      id: 31795,
      contentGuid: 'be6fd850-f5c6-45e0-9487-66dfafa62a74',
      editViewFriendlyTitle: 'Selection',
      type: 'SelectionElementBlockProxy',
      value: 'Freehold',
      properties: {
        Label: 'What is the tenure type of the property? (please select your answer)',
        Validators: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
        Feed: 'FormsFeed_UseManualInput',
        Items: [
          {
            caption: 'Freehold',
            value: 'Freehold',
            checked: false
          },
          {
            caption: 'Leasehold',
            value: 'Leasehold',
            checked: false
          },
          {
            caption: 'Share of freehold',
            value: 'Share of freehold',
            checked: false
          },
          {
            caption: 'Feudal',
            value: 'Feudal',
            checked: false
          },
          {
            caption: 'Unknown',
            value: 'Unknown',
            checked: false
          }
        ],
        ValidatorMessages: [
          {
            validator: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
            message: 'This field is required.'
          }
        ],
        Conditions: []
      }
    },
    {
      name: 'Did you buy the property on a shared ownership scheme',
      id: 31796,
      contentGuid: 'b2c5e535-8c79-4c92-9ef4-93aee94a8597',
      editViewFriendlyTitle: 'Selection',
      type: 'SelectionElementBlockProxy',
      value: 'No',
      properties: {
        Label: 'Did you buy the property on a shared ownership scheme or other discounted or low cost housing scheme? (please select your answer)   If yes, please state the percentage share being sold ',
        Validators: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
        Feed: 'FormsFeed_UseManualInput',
        Items: [
          {
            caption: 'Yes',
            value: 'Yes',
            checked: false
          },
          {
            caption: 'No',
            value: 'No',
            checked: false
          },
          {
            caption: 'Not known',
            value: 'Not known',
            checked: false
          }
        ],
        ValidatorMessages: [
          {
            validator: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
            message: 'This field is required.'
          }
        ],
        Conditions: []
      }
    },
    {
      name: 'Shared Ownership (Yes TextArea)',
      id: 31799,
      contentGuid: '44599ec0-e79a-423b-9ebb-8af824abc69e',
      editViewFriendlyTitle: 'Text area',
      type: 'TextareaElementBlockProxy',
      value: '',
      properties: {
        Label: 'Please state the percentage share being sold',
        Validators: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
        ValidatorMessages: [
          {
            validator: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
            message: 'This field is required.'
          }
        ],
        SatisfiedAction: 'EPiServer.Forms.Core.Internal.Dependency.ShowAction',
        ConditionCombination: 1,
        Conditions: [
          {
            field: {
              id: 31796,
              workID: 0,
              providerName: null,
              getPublishedOrLatest: false,
              isExternalProvider: false,
              isReadOnly: false
            },
            operator: 2,
            fieldValue: 'Yes'
          }
        ]
      }
    },
    {
      name: 'Boundaries',
      id: 31816,
      contentGuid: '4b4d181a-6b20-4c50-b51d-cb3fd44ecf7b',
      editViewFriendlyTitle: 'Boundaries',
      type: 'FormStepBlockProxy',
      value: '',
      properties: {
        Label: 'Boundaries'
      }
    },
    {
      name: 'Are there any rights or arrangements affecting the property',
      id: 31821,
      contentGuid: '7a400a41-6e2c-4d89-b782-241755844188',
      editViewFriendlyTitle: 'Selection',
      type: 'SelectionElementBlockProxy',
      value: '',
      properties: {
        Label:
          'Are there any rights or arrangements affecting the property, including rights to use parts of neighbouring land (such as a right of way over a driveway, path, or access road), or any other rights or obligations relating to the property?  (please select your answer) If yes, please provide or attach information',
        Validators: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
        Feed: 'FormsFeed_UseManualInput',
        Items: [
          {
            caption: 'Yes',
            value: 'Yes',
            checked: false
          },
          {
            caption: 'No',
            value: 'No',
            checked: false
          },
          {
            caption: 'Not Known',
            value: 'Not Known',
            checked: false
          }
        ],
        ValidatorMessages: [
          {
            validator: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
            message: 'This field is required.'
          }
        ],
        Conditions: []
      }
    },
    {
      name: 'Arrangement(Yes)',
      id: 31822,
      contentGuid: '46ba047c-cf84-44b6-b39e-8b4ef31324f4',
      editViewFriendlyTitle: 'Text area',
      type: 'TextareaElementBlockProxy',
      value: '',
      properties: {
        Label: 'If yes, please provide or attach information',
        Validators: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
        ValidatorMessages: [
          {
            validator: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
            message: 'This field is required.'
          }
        ],
        SatisfiedAction: 'EPiServer.Forms.Core.Internal.Dependency.ShowAction',
        ConditionCombination: 1,
        Conditions: [
          {
            field: {
              id: 31821,
              workID: 0,
              providerName: null,
              getPublishedOrLatest: false,
              isExternalProvider: false,
              isReadOnly: false
            },
            operator: 2,
            fieldValue: 'Yes'
          }
        ]
      }
    },
    {
      name: 'Points of note',
      id: 31812,
      contentGuid: 'bcafdcb8-07e2-432b-9624-3672f55d2d49',
      editViewFriendlyTitle: 'Points of note',
      type: 'FormStepBlockProxy',
      value: '',
      properties: {
        Label: 'Points of note'
      }
    },
    {
      name: 'Insurance Refused',
      id: 31814,
      contentGuid: '3e04be8c-7889-42a2-8a2f-14f46dbf7dab',
      editViewFriendlyTitle: 'Selection',
      type: 'SelectionElementBlockProxy',
      value: '',
      properties: {
        Label: 'Has insurance for the property ever been refused? (please select your answer) If yes, please provide or attach information ',
        Validators: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
        Feed: 'FormsFeed_UseManualInput',
        Items: [
          {
            caption: 'Yes',
            value: 'Yes',
            checked: false
          },
          {
            caption: 'No',
            value: 'No',
            checked: false
          },
          {
            caption: 'Not Known',
            value: 'Not Known',
            checked: false
          }
        ],
        ValidatorMessages: [
          {
            validator: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
            message: 'This field is required.'
          }
        ],
        Conditions: []
      }
    },
    {
      name: 'Insurance refused(Yes)',
      id: 31815,
      contentGuid: '8d0a7043-056c-4a14-b279-5014f755b613',
      editViewFriendlyTitle: 'Text area',
      type: 'TextareaElementBlockProxy',
      value: '',
      properties: {
        Label: 'Please provide or attach information',
        Validators: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
        ValidatorMessages: [
          {
            validator: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
            message: 'This field is required.'
          }
        ],
        SatisfiedAction: 'EPiServer.Forms.Core.Internal.Dependency.ShowAction',
        ConditionCombination: 1,
        Conditions: [
          {
            field: {
              id: 31814,
              workID: 0,
              providerName: null,
              getPublishedOrLatest: false,
              isExternalProvider: false,
              isReadOnly: false
            },
            operator: 0,
            fieldValue: 'Yes'
          }
        ]
      }
    },
    {
      name: 'Facilities',
      id: 31811,
      contentGuid: '1b8f2ade-ce13-42eb-ba4f-7d685f2e8925',
      editViewFriendlyTitle: 'Facilities',
      type: 'FormStepBlockProxy',
      value: '',
      properties: {
        Label: 'Facilities'
      }
    },
    {
      name: 'Have solar panels been installed?',
      id: 31809,
      contentGuid: 'dc46d4d4-3289-4fea-9ec8-8c23517de88b',
      editViewFriendlyTitle: 'Selection',
      type: 'SelectionElementBlockProxy',
      value: '',
      properties: {
        Label: 'Have solar panels been installed?  (please select your answer) If yes, please provide or attach information',
        Validators: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
        Feed: 'FormsFeed_UseManualInput',
        Items: [
          {
            caption: 'Yes',
            value: 'Yes',
            checked: false
          },
          {
            caption: 'No',
            value: 'No',
            checked: false
          },
          {
            caption: 'Not Known',
            value: 'Not Known',
            checked: false
          }
        ],
        ValidatorMessages: [
          {
            validator: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
            message: 'This field is required.'
          }
        ],
        Conditions: []
      }
    },
    {
      name: 'Solar Panel (Yes)',
      id: 31810,
      contentGuid: 'ad59eba1-ea26-4e40-a420-d8015961c6bc',
      editViewFriendlyTitle: 'Text area',
      type: 'TextareaElementBlockProxy',
      value: '',
      properties: {
        Label: 'If yes, please provide or attach information',
        Validators: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
        ValidatorMessages: [
          {
            validator: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
            message: 'This field is required.'
          }
        ],
        SatisfiedAction: 'EPiServer.Forms.Core.Internal.Dependency.ShowAction',
        ConditionCombination: 1,
        Conditions: [
          {
            field: {
              id: 31809,
              workID: 0,
              providerName: null,
              getPublishedOrLatest: false,
              isExternalProvider: false,
              isReadOnly: false
            },
            operator: 2,
            fieldValue: 'Yes'
          }
        ]
      }
    },
    {
      name: 'Services',
      id: 31817,
      contentGuid: '6c6ceb3a-f5fa-452e-af1b-47bd68ae3651',
      editViewFriendlyTitle: 'Services',
      type: 'FormStepBlockProxy',
      value: '',
      properties: {
        Label: 'Services'
      }
    },
    {
      name: 'Disclaimer',
      id: 31823,
      contentGuid: 'a5ff4a5b-e952-4ca7-b50d-8d62352b436a',
      editViewFriendlyTitle: 'Multiple or single choice',
      type: 'ChoiceElementBlockProxy',
      value: '',
      properties: {
        Label: ' ',
        Validators: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
        AllowMultiSelect: true,
        Feed: 'FormsFeed_UseManualInput',
        Items: [
          {
            caption: 'By submitting this document, you confirm that the information provided is true, accurate and complete to the best of your knowledge on behalf of all legal owners of this property.',
            value: 'Disclaimer',
            checked: false
          }
        ],
        ValidatorMessages: [
          {
            validator: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
            message: 'This field is required.'
          }
        ],
        Conditions: []
      }
    }
  ],
  submissionId: '309fd108-701f-c719-5c02-91c3ade03772',
  antiforgery: {
    token: 'CfDJ8AAa_RkF7odDpC0yc3-aIsnRZhpfvAVMZgp9yqLhAEP3L2Stu-Ykeen2XcortymXGzn4X766bM0PRX7Agqrb_3HQlkxGOPyZRRWJhxkf2Tc7jBM66LlhvLgn9-FxynDSc0Zrl14fPGXtmMrqDSq08UU',
    headerName: 'RequestVerificationToken'
  }
};

@Injectable({ providedIn: 'root' })
export class EpiserverFormService {
  readonly endpoint = 'http://localhost:8000/test-episerver-form';
  readonly debug = true;


  apiBaseURLPrefix = 'http://localhost:8000/api/'

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

  private toFormData(source: EpiserverFormDefinition, model: FormSubmitModel): FormData | Record<string, unknown> {
    const formData = new FormData();
    const fields: Record<string, unknown> = {};
    const fieldKeyMap = this.buildFieldKeyMap(source);
    let hasFileData = false;

    model.submissionData.forEach((submission: FormSubmission) => {
      const serializedKey = fieldKeyMap.get(submission.elementKey) ?? submission.elementKey;
      const value = submission.value;
      if (value === null || value === undefined || value === '') {
        return;
      }

      if (this.appendFileData(value, serializedKey, formData, fields)) {
        hasFileData = true;
        return;
      }

      fields[serializedKey] = value;
    });

    const removedFileFields = this.collectRemovedFileFields(source, model);
    if (removedFileFields.length > 0) {
      hasFileData = true;
      removedFileFields.forEach(value => formData.append('RemovedFileFields', value));
    }

    const payload = {
      FormKey: model.formKey,
      Locale: model.locale,
      IsFinalized: model.isFinalized,
      SubmissionKey: model.partialSubmissionKey,
      HostedPageUrl: model.hostedPageUrl,
      CurrentStep: model.currentStepIndex,
      Fields: fields
    };

    if (!hasFileData) {
      return payload;
    }

    formData.append('data', JSON.stringify(payload));

    return formData;
  }

  private buildFieldKeyMap(source: EpiserverFormDefinition): Map<string, string> {
    const map = new Map<string, string>();

    source.fields.forEach(field => {
      const fieldId = field.contentLink?.id ?? field.id;
      if (typeof fieldId === 'number') {
        map.set(field.contentGuid, '__field_' + fieldId);
      }
    });

    return map;
  }

  private appendFileData(value: unknown, serializedKey: string, formData: FormData, fields: Record<string, unknown>): boolean {
    if (!Array.isArray(value) || value.length === 0 || typeof value[0] !== 'object') {
      return false;
    }

    const files = value as Array<{ name?: string; url?: string; assetGuid?: string; file?: File }>;
    let hasBrowserFile = false;

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index].file;
      if (file) {
        hasBrowserFile = true;
        formData.append(serializedKey + '_file_' + index, file);
      }
    }

    fields[serializedKey] = JSON.stringify(
      files.map(file => ({
        DownloadUrl: file.url ?? '',
        Name: file.name ?? file.file?.name ?? '',
        AssetGuid: file.assetGuid ?? ''
      }))
    );
    return hasBrowserFile;
  }

  private collectRemovedFileFields(source: EpiserverFormDefinition, model: FormSubmitModel): string[] {
    return model.submissionData.flatMap(submission => {
      const sourceField = source.fields.find(field => field.contentGuid === submission.elementKey && field.type === 'FileUploadElementBlockProxy');
      if (!sourceField) {
        return [];
      }

      const fieldId = sourceField.contentLink?.id ?? sourceField.id;
      if (typeof fieldId !== 'number') {
        return [];
      }

      const originalUrls = new Set(this.extractUploadedFileUrls(sourceField.value));
      if (originalUrls.size === 0) {
        return [];
      }

      const currentUrls = new Set(this.extractUploadedFileUrls(submission.value));
      return Array.from(originalUrls)
        .filter(url => !currentUrls.has(url))
        .map(url => `__fields_${fieldId}|${url}`);
    });
  }

  private extractUploadedFileUrls(value: unknown): string[] {
    const parsed = this.parseUploadedFileValue(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(entry => {
        if (!entry || typeof entry !== 'object') {
          return null;
        }

        const file = entry as Record<string, unknown>;
        const url = file['url'] ?? file['Url'] ?? file['downloadUrl'] ?? file['DownloadUrl'] ?? file['value'] ?? file['Value'];
        return typeof url === 'string' && url.trim() ? url : null;
      })
      .filter((url): url is string => url !== null);
  }

  private parseUploadedFileValue(value: unknown): unknown {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      return [];
    }
  }

  private cloneForm(source: EpiserverFormDefinition): EpiserverFormDefinition {
    return JSON.parse(JSON.stringify(source)) as EpiserverFormDefinition;
  }
}
