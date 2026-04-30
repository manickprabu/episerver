import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';

import { EpiserverFormsSdkModule } from '../../episerver-forms/episerver-sdk';
import { FormSchema } from '../models/form-schema.model';
import { FormSubmissionService } from './form-submission.service';

const sampleForm = {
  key: 'support-request',
  locale: 'en',
  localizations: {},
  properties: {
    title: 'Support request',
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
      key: 'firstName',
      contentType: 'TextboxElementBlock',
      displayName: 'First name',
      locale: 'en',
      localizations: {},
      properties: { label: 'First name', description: '' }
    },
    {
      key: 'interests',
      contentType: 'ChoiceElementBlock',
      displayName: 'Topics',
      locale: 'en',
      localizations: {},
      properties: { label: 'Topics', description: '', allowMultiSelect: true }
    }
  ],
  steps: []
} as FormSchema;

describe('FormSubmissionService', () => {
  let service: FormSubmissionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EpiserverFormsSdkModule],
      providers: [FormSubmissionService]
    });

    service = TestBed.inject(FormSubmissionService);
  });

  it('serializes the current control values into form submissions', () => {
    const formGroup = new FormGroup({
      firstName: new FormControl('Ada'),
      interests: new FormControl(['planning', 'payloads'])
    });

    const submissions = service.toFormSubmissions(sampleForm, formGroup);

    expect(submissions).toEqual([
      { elementKey: 'firstName', value: 'Ada' },
      { elementKey: 'interests', value: 'planning,payloads' }
    ]);
  });

  it('builds the same submit model shape used by the SDK submitter', () => {
    const model = service.buildSubmitModel(
      sampleForm,
      [{ elementKey: 'firstName', value: 'Ada' }],
      1,
      'https://app.example/forms/container',
      'token-123',
      true,
      'partial-456'
    );

    expect(model).toEqual({
      formKey: 'support-request',
      locale: 'en',
      submissionData: [{ elementKey: 'firstName', value: 'Ada' }],
      isFinalized: true,
      partialSubmissionKey: 'partial-456',
      hostedPageUrl: 'https://app.example/forms/container',
      accessToken: 'token-123',
      currentStepIndex: 1
    });
  });
});
