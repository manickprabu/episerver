import { TestBed } from '@angular/core/testing';

import { FormContainer } from '../models';
import { BrowserStorageService } from './browser-storage.service';
import { ConditionFunctionsService } from './condition-functions.service';
import { FormStorageService } from './form-storage.service';
import { StepDependConditionService } from './step-depend-condition.service';
import { StepHelperService } from './step-helper.service';

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
      elements: []
    },
    {
      formStep: {
        key: 'step-2',
        contentType: 'FormStepBlock',
        displayName: 'Step 2',
        properties: {
          attachedContentLink: '/step-two',
          dependField: { key: 'country' },
          dependCondition: 'Equals',
          dependValue: 'UK'
        },
        localizations: {},
        locale: 'en'
      },
      elements: []
    }
  ],
  localizations: {},
  locale: 'en'
};

describe('StepDependConditionService', () => {
  let service: StepDependConditionService;
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    storage.setItem(form.key, JSON.stringify([{ elementKey: 'country', value: 'UK' }]));

    TestBed.configureTestingModule({
      providers: [
        ConditionFunctionsService,
        FormStorageService,
        StepDependConditionService,
        StepHelperService,
        {
          provide: BrowserStorageService,
          useValue: {
            getSessionStorage: () => storage
          }
        }
      ]
    });

    service = TestBed.inject(StepDependConditionService);
  });

  it('finds the next active step', () => {
    expect(service.findNextStep(form, 0, [])).toBe(1);
  });

  it('marks dependent steps as active when the condition is satisfied', () => {
    expect(service.isSatisfied(form, 1, [])).toBe(true);
  });

  it('validates step display against the attached content path', () => {
    expect(service.isStepValidToDisplay(form, 1, 'https://example.com/step-two', [])).toBe(true);
  });
});
