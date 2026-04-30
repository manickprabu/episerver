import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { EpiserverFormsModule } from '../../../episerver-forms.module';
import { FormConfirmationService } from '../../../services/form-confirmation.service';
import { FormNavigationService } from '../../../services/form-navigation.service';
import { FormSubmissionService } from '../../../services/form-submission.service';
import { FormContainerComponent } from './form-container.component';

const sampleForm = {
  key: 'support-request',
  locale: 'en',
  localizations: {
    nextButtonLabel: 'Next',
    previousButtonLabel: 'Previous',
    pageButtonLabel: 'Page'
  },
  properties: {
    title: 'Support request',
    allowToStoreSubmissionData: true,
    showSummarizedData: false,
    confirmationMessage: '',
    resetConfirmationMessage: '',
    redirectToPage: '',
    submitSuccessMessage: 'Thanks.',
    allowAnonymousSubmission: true,
    allowMultipleSubmission: true,
    showNavigationBar: true,
    description: 'Preserve the original field order.',
    metadataAttribute: '',
    focusOnForm: false
  },
  formElements: [
    {
      key: 'step-1',
      contentType: 'FormStepBlock',
      displayName: 'About you',
      locale: 'en',
      localizations: {},
      properties: { label: 'About you', description: '' }
    },
    {
      key: 'firstName',
      contentType: 'TextboxElementBlock',
      displayName: 'First name',
      locale: 'en',
      localizations: {},
      properties: {
        label: 'First name',
        description: '',
        validators: [
          {
            type: 'RequiredValidator',
            validationOrder: 0,
            description: 'Required',
            model: { message: 'First name is required.', validationCssClass: '', additionalAttributes: {} }
          }
        ]
      }
    },
    {
      key: 'step-2',
      contentType: 'FormStepBlock',
      displayName: 'Details',
      locale: 'en',
      localizations: {},
      properties: { label: 'Details', description: '' }
    },
    {
      key: 'details',
      contentType: 'TextareaElementBlock',
      displayName: 'Details',
      locale: 'en',
      localizations: {},
      properties: { label: 'Details', description: '' }
    },
    {
      key: 'submitForm',
      contentType: 'SubmitButtonElementBlock',
      displayName: 'Submit',
      locale: 'en',
      localizations: {},
      properties: { label: 'Submit', description: '' }
    }
  ],
  steps: []
} as any;

describe('FormContainerComponent', () => {
  const submissionService = {
    toFormSubmissions: vi.fn(),
    collectCurrentStepSubmissions: vi.fn(),
    validateStep: vi.fn(),
    clearValidationResults: vi.fn(),
    applyValidationResults: vi.fn(),
    buildSubmitModel: vi.fn(),
    submit: vi.fn(),
    firstInvalidControlKey: vi.fn(),
    applyServerValidation: vi.fn()
  } as unknown as FormSubmissionService;
  const confirmationService = {
    buildSummary: vi.fn()
  } as unknown as FormConfirmationService;
  const navigationService = {
    resolveInitialStepIndex: vi.fn(),
    findPreviousStep: vi.fn(),
    findNextStep: vi.fn(),
    isStepValidToDisplay: vi.fn(),
    isMalFormSteps: vi.fn(),
    goToStep: vi.fn(),
    clearNavigationState: vi.fn(),
    loadDraft: vi.fn(),
    saveDraft: vi.fn()
  } as unknown as FormNavigationService;

  beforeEach(async () => {
    vi.mocked(submissionService.toFormSubmissions).mockReturnValue([{ elementKey: 'firstName', value: 'Ada' }]);
    vi.mocked(submissionService.collectCurrentStepSubmissions).mockReturnValue([{ elementKey: 'firstName', value: 'Ada' }]);
    vi.mocked(submissionService.validateStep).mockReturnValue([]);
    vi.mocked(submissionService.clearValidationResults).mockReturnValue(undefined);
    vi.mocked(submissionService.applyValidationResults).mockReturnValue(undefined);
    vi.mocked(submissionService.buildSubmitModel).mockReturnValue({
      formKey: 'support-request',
      locale: 'en',
      submissionData: [{ elementKey: 'firstName', value: 'Ada' }],
      isFinalized: false,
      partialSubmissionKey: '',
      hostedPageUrl: 'https://app.example/forms/container',
      currentStepIndex: 0
    });
    vi.mocked(submissionService.submit).mockReturnValue(
      of({ success: true, submissionKey: 'sub-123', validationFail: false, messages: [] })
    );
    vi.mocked(submissionService.firstInvalidControlKey).mockReturnValue('firstName');
    vi.mocked(confirmationService.buildSummary).mockReturnValue('Details: preserve behavior.');
    vi.mocked(navigationService.resolveInitialStepIndex).mockReturnValue(0);
    vi.mocked(navigationService.findPreviousStep).mockReturnValue(0);
    vi.mocked(navigationService.findNextStep).mockReturnValue(1);
    vi.mocked(navigationService.isStepValidToDisplay).mockReturnValue(true);
    vi.mocked(navigationService.isMalFormSteps).mockReturnValue(false);

    await TestBed.configureTestingModule({
      imports: [EpiserverFormsModule],
      providers: [
        { provide: FormSubmissionService, useValue: submissionService },
        { provide: FormConfirmationService, useValue: confirmationService },
        { provide: FormNavigationService, useValue: navigationService }
      ]
    }).compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(FormContainerComponent);
    fixture.componentRef.setInput('form', sampleForm);
    fixture.componentRef.setInput('baseUrl', 'https://cms.example/');
    fixture.componentRef.setInput('currentPageUrl', 'https://app.example/forms/container');
    fixture.detectChanges();
    return fixture;
  }

  it('renders the form title and first step fields', () => {
    const fixture = createComponent();

    expect(fixture.nativeElement.textContent).toContain('Support request');
    expect(fixture.nativeElement.textContent).toContain('First name');
  });

  it('stays on the current step when validation fails', () => {
    vi.mocked(submissionService.validateStep).mockReturnValue([
      { elementKey: 'firstName', result: { valid: false, message: 'First name is required.' } }
    ]);

    const fixture = createComponent();
    const nextButton = fixture.nativeElement.querySelector('.btnNext') as HTMLButtonElement;

    nextButton.click();
    fixture.detectChanges();

    expect(submissionService.applyValidationResults).toHaveBeenCalled();
    expect(navigationService.goToStep).not.toHaveBeenCalled();
  });

  it('submits a partial save before moving to the next step', () => {
    const fixture = createComponent();
    const nextButton = fixture.nativeElement.querySelector('.btnNext') as HTMLButtonElement;

    nextButton.click();
    fixture.detectChanges();

    expect(submissionService.buildSubmitModel).toHaveBeenCalled();
    expect(submissionService.submit).toHaveBeenCalled();
    expect(navigationService.goToStep).toHaveBeenCalled();
  });
});
