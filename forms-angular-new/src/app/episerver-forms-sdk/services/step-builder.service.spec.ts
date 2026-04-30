import { TestBed } from '@angular/core/testing';

import { FormContainer } from '../models';
import { StepBuilderService } from './step-builder.service';

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
  formElements: [
    {
      key: 'first-name',
      contentType: 'TextboxElementBlock',
      displayName: 'First name',
      properties: { description: '', label: 'First name' },
      localizations: {},
      locale: 'en'
    },
    {
      key: 'step-two',
      contentType: 'FormStepBlock',
      displayName: 'Step two',
      properties: { description: '', label: '' },
      localizations: {},
      locale: 'en'
    },
    {
      key: 'email',
      contentType: 'TextboxElementBlock',
      displayName: 'Email',
      properties: { description: '', label: 'Email' },
      localizations: {},
      locale: 'en'
    }
  ],
  steps: [],
  localizations: {},
  locale: 'en'
};

describe('StepBuilderService', () => {
  let service: StepBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [StepBuilderService] });
    service = TestBed.inject(StepBuilderService);
  });

  it('builds implicit and explicit steps from form elements', () => {
    const built = service.buildForm(form);

    expect(built.steps).toHaveLength(2);
    expect(built.steps[0].elements.map((element) => element.key)).toEqual(['first-name']);
    expect(built.steps[1].elements.map((element) => element.key)).toEqual(['step-two', 'email']);
  });
});
