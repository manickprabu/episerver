import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { EpiserverFormsSdkModule, FormSubmission } from '../../episerver-forms/sdk';
import { FormSchema } from '../models/form-schema.model';
import { FormNavigationService } from './form-navigation.service';

const sampleForm = {
  key: 'linked-form',
  locale: 'en',
  localizations: {},
  properties: {
    title: 'Linked form',
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
        displayName: 'Step one',
        locale: 'en',
        localizations: {},
        properties: {
          label: 'Step one',
          description: '',
          attachedContentLink: '/forms/steps/one'
        }
      },
      elements: []
    },
    {
      formStep: {
        key: 'step-2',
        contentType: 'FormStepBlock',
        displayName: 'Step two',
        locale: 'en',
        localizations: {},
        properties: {
          label: 'Step two',
          description: '',
          attachedContentLink: '/forms/steps/two'
        }
      },
      elements: []
    }
  ]
} as FormSchema;

describe('FormNavigationService', () => {
  let service: FormNavigationService;
  const navigateByUrl = vi.fn().mockResolvedValue(true);

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      imports: [EpiserverFormsSdkModule],
      providers: [
        FormNavigationService,
        {
          provide: Router,
          useValue: { navigateByUrl }
        },
        {
          provide: DOCUMENT,
          useValue: document
        }
      ]
    });

    service = TestBed.inject(FormNavigationService);
    navigateByUrl.mockClear();
  });

  it('prefers the cached step index when one is available', () => {
    sessionStorage.setItem('form_current_step_linked-form', '1');

    const index = service.resolveInitialStepIndex(sampleForm, 'https://app.example/forms/steps/one');

    expect(index).toBe(1);
  });

  it('persists submissions and navigates to the next attached content route', () => {
    const submissions: FormSubmission[] = [{ elementKey: 'firstName', value: 'Ada' }];

    service.goToStep(sampleForm, 1, submissions);

    expect(sessionStorage.getItem('form_current_step_linked-form')).toBe('1');
    expect(sessionStorage.getItem('linked-form')).toContain('Ada');
    expect(navigateByUrl).toHaveBeenCalledWith('/forms/steps/two');
  });
});
