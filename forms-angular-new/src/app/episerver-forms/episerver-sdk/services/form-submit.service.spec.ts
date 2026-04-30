import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { FormContainer, FormSubmission, ValidatorType } from '../models';
import { BrowserStorageService } from './browser-storage.service';
import { FormStorageService } from './form-storage.service';
import { FormSubmitService } from './form-submit.service';
import { FormValidatorService } from './form-validator.service';

class MemoryStorage implements Storage {
  private readonly state = new Map<string, string>();
  get length(): number { return this.state.size; }
  clear(): void { this.state.clear(); }
  getItem(key: string): string | null { return this.state.has(key) ? this.state.get(key)! : null; }
  key(index: number): string | null { return Array.from(this.state.keys())[index] ?? null; }
  removeItem(key: string): void { this.state.delete(key); }
  setItem(key: string, value: string): void { this.state.set(key, value); }
}

const form: FormContainer = {
  key: 'demo-form',
  properties: {
    title: 'Demo',
    allowToStoreSubmissionData: true,
    showSummarizedData: false,
    confirmationMessage: '',
    resetConfirmationMessage: '',
    redirectToPage: '',
    submitSuccessMessage: '',
    allowAnonymousSubmission: true,
    allowMultipleSubmission: true,
    showNavigationBar: true,
    description: '',
    metadataAttribute: '',
    focusOnForm: false
  },
  formElements: [
    {
      key: 'name',
      contentType: 'TextboxElementBlock',
      displayName: 'Name',
      properties: {
        description: '',
        label: 'Name',
        validators: [
          {
            type: ValidatorType.RequiredValidator,
            validationOrder: 1,
            description: 'Required',
            model: {
              message: 'This field is required.',
              validationCssClass: '',
              additionalAttributes: null
            }
          }
        ]
      },
      localizations: {},
      locale: 'en'
    }
  ],
  steps: [],
  localizations: {},
  locale: 'en'
};

describe('FormSubmitService', () => {
  let service: FormSubmitService;
  let httpMock: HttpTestingController;
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();

    TestBed.configureTestingModule({
      providers: [
        FormStorageService,
        FormSubmitService,
        FormValidatorService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: BrowserStorageService,
          useValue: {
            getSessionStorage: () => storage
          }
        }
      ]
    });

    service = TestBed.inject(FormSubmitService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('combines current and stored submissions without duplicates', () => {
    const result = service.combineData(
      [{ elementKey: 'country', value: 'UK' }],
      [{ elementKey: 'name', value: 'Ada' }]
    );

    expect(result).toEqual([
      { elementKey: 'name', value: 'Ada' },
      { elementKey: 'country', value: 'UK' }
    ]);
  });

  it('submits multipart form data and clears storage for finalized submissions', async () => {
    const promise = service.doSubmit(form, '/', {
      formKey: 'demo-form',
      locale: 'en',
      submissionData: [{ elementKey: 'name', value: 'Ada' }],
      isFinalized: true,
      partialSubmissionKey: 'partial-1',
      hostedPageUrl: 'https://example.com/form',
      accessToken: 'token-123',
      currentStepIndex: 0
    });

    const req = httpMock.expectOne('/_forms/v1/forms');
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    expect(req.request.body instanceof FormData).toBe(true);
    expect((req.request.body as FormData).get('data')).toContain('"FormKey":"demo-form"');

    req.flush({
      success: true,
      submissionKey: 'done-1',
      validationFail: false,
      messages: []
    });

    await expect(promise).resolves.toEqual({
      success: true,
      submissionKey: 'done-1',
      validationFail: false,
      messages: []
    });
    expect(storage.getItem(form.key)).toBeNull();
  });

  it('returns field validation results before submit', () => {
    const results = service.doValidate(form, [{ elementKey: 'name', value: '' } as FormSubmission]);

    expect(results).toEqual([
      {
        elementKey: 'name',
        result: {
          valid: false,
          message: 'This field is required.'
        }
      }
    ]);
  });
});
