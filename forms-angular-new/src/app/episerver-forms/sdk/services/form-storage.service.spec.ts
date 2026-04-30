import { TestBed } from '@angular/core/testing';

import { FormContainer, FormSubmission } from '../models';
import { BrowserStorageService } from './browser-storage.service';
import { FormStorageService } from './form-storage.service';

class MemoryStorage implements Storage {
  private readonly state = new Map<string, string>();

  get length(): number {
    return this.state.size;
  }

  clear(): void {
    this.state.clear();
  }

  getItem(key: string): string | null {
    return this.state.has(key) ? this.state.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.state.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.state.delete(key);
  }

  setItem(key: string, value: string): void {
    this.state.set(key, value);
  }
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
  steps: [],
  localizations: {},
  locale: 'en'
};

describe('FormStorageService', () => {
  let service: FormStorageService;
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();

    TestBed.configureTestingModule({
      providers: [
        FormStorageService,
        {
          provide: BrowserStorageService,
          useValue: {
            getSessionStorage: () => storage
          }
        }
      ]
    });

    service = TestBed.inject(FormStorageService);
  });

  it('saves and loads form submissions by form key', () => {
    const submission: FormSubmission[] = [{ elementKey: 'name', value: 'Ada' }];

    service.saveFormDataToStorage(form, submission);

    expect(service.loadFormDataFromStorage(form)).toEqual(submission);
  });

  it('returns an empty array when nothing is stored', () => {
    expect(service.loadFormDataFromStorage(form)).toEqual([]);
  });

  it('removes stored submissions for the form', () => {
    service.saveFormDataToStorage(form, [{ elementKey: 'name', value: 'Ada' }]);
    service.removeFormDataInStorage(form);

    expect(service.loadFormDataFromStorage(form)).toEqual([]);
  });
});
