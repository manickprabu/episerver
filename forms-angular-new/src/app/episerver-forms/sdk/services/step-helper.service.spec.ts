import { TestBed } from '@angular/core/testing';

import { FormContainer, FormValidationResult } from '../models';
import { StepHelperService } from './step-helper.service';

const form: FormContainer = {
  key: 'demo',
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
          properties: { description: '', label: 'Name' },
          localizations: {},
          locale: 'en'
        }
      ]
    },
    {
      formStep: {
        key: 'step-2',
        contentType: 'FormStepBlock',
        displayName: 'Step 2',
        properties: { attachedContentLink: '/step-two', dependField: { key: 'name' } },
        localizations: {},
        locale: 'en'
      },
      elements: [
        {
          key: 'email',
          contentType: 'TextboxElementBlock',
          displayName: 'Email',
          properties: { description: '', label: 'Email' },
          localizations: {},
          locale: 'en'
        }
      ]
    }
  ],
  localizations: {},
  locale: 'en'
};

describe('StepHelperService', () => {
  let service: StepHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [StepHelperService] });
    service = TestBed.inject(StepHelperService);
  });

  it('resolves the current step from the page url', () => {
    expect(service.getCurrentStepIndex(form, 'https://example.com/step-two')).toBe(1);
  });

  it('finds the first invalid element in a step', () => {
    const results: FormValidationResult[] = [
      { elementKey: 'name', result: { valid: false, message: 'Required' } },
      { elementKey: 'email', result: { valid: false, message: 'Required' } }
    ];

    expect(service.getFirstInvalidElement(form, results, 1)).toBe('email');
  });

  it('detects step dependency checks', () => {
    expect(service.isNeedCheckDependCondition(form, 1)).toBe(true);
  });
});
