import { TestBed } from '@angular/core/testing';

import { FormContainer } from '../models';
import { BrowserStorageService } from './browser-storage.service';
import { FormCacheService } from './form-cache.service';
import { FormStateInitService } from './form-state-init.service';
import { FormStorageService } from './form-storage.service';
import { StepHelperService } from './step-helper.service';

class MemoryStorage implements Storage {
  private readonly state = new Map<string, string>();

  get length(): number {
    return this.state.size;
  }
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
  formElements: [],
  steps: [
    {
      formStep: {
        key: 'step-1',
        contentType: 'FormStepBlock',
        displayName: 'Step 1',
        properties: { attachedContentLink: '/step-one' },
        localizations: {},
        locale: 'en'
      },
      elements: [
        {
          key: 'name',
          contentType: 'TextboxElementBlock',
          displayName: 'Name',
          properties: { description: '', label: 'Name', predefinedValue: 'Ada' },
          localizations: {},
          locale: 'en'
        }
      ]
    }
  ],
  localizations: {},
  locale: 'en'
};

describe('FormStateInitService', () => {
  let service: FormStateInitService;
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();

    TestBed.configureTestingModule({
      providers: [
        FormCacheService,
        FormStateInitService,
        FormStorageService,
        StepHelperService,
        {
          provide: BrowserStorageService,
          useValue: {
            getSessionStorage: () => storage
          }
        }
      ]
    });

    service = TestBed.inject(FormStateInitService);
  });

  it('initializes default submissions and validation state', () => {
    const state = service.initFormState(form, 'https://example.com/step-one');

    expect(state.currentStepIndex).toBe(0);
    expect(state.formSubmissions).toEqual([{ elementKey: 'name', value: 'Ada' }]);
    expect(state.formValidationResults).toEqual([
      { elementKey: 'name', result: { valid: true, message: '' } }
    ]);
  });

  it('hydrates saved submission values from storage', () => {
    storage.setItem(form.key, JSON.stringify([{ elementKey: 'name', value: 'Grace' }]));

    const state = service.initFormState(form, 'https://example.com/step-one');

    expect(state.formSubmissions).toEqual([{ elementKey: 'name', value: 'Grace' }]);
  });
});
