import { TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
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

function createConditionalForm(overrides?: { sourceDefaultValue?: string; secondSourceDefaultValue?: string; conditionCombination?: 'All' | 'Any'; conditions?: Array<{ field: string; operator: string; fieldValue: string }> }): any {
  return {
    key: 'conditional-form',
    locale: 'en',
    localizations: {
      nextButtonLabel: 'Next',
      previousButtonLabel: 'Previous',
      pageButtonLabel: 'Page'
    },
    properties: {
      title: 'Conditional form',
      allowToStoreSubmissionData: true,
      showSummarizedData: false,
      confirmationMessage: '',
      resetConfirmationMessage: '',
      redirectToPage: '',
      submitSuccessMessage: 'Thanks.',
      allowAnonymousSubmission: true,
      allowMultipleSubmission: true,
      showNavigationBar: true,
      description: 'Conditional rendering',
      metadataAttribute: '',
      focusOnForm: false
    },
    formElements: [
      {
        key: 'step-1',
        contentType: 'FormStepBlock',
        displayName: 'Step one',
        locale: 'en',
        localizations: {},
        properties: { label: 'Step one', description: '' }
      },
      {
        key: 'source',
        contentType: 'SelectionElementBlock',
        displayName: 'Source',
        locale: 'en',
        localizations: { selectionDefaultPlaceholder: 'Select an option' },
        properties: {
          label: 'Did you buy the property on a shared ownership scheme',
          description: '',
          predefinedValue: overrides?.sourceDefaultValue ?? '',
          items: [
            { caption: 'Yes', value: 'Yes', checked: overrides?.sourceDefaultValue === 'Yes' },
            { caption: 'No', value: 'No', checked: overrides?.sourceDefaultValue === 'No' }
          ]
        }
      },
      {
        key: 'source-2',
        contentType: 'SelectionElementBlock',
        displayName: 'Source 2',
        locale: 'en',
        localizations: { selectionDefaultPlaceholder: 'Select an option' },
        properties: {
          label: 'Second condition',
          description: '',
          predefinedValue: overrides?.secondSourceDefaultValue ?? '',
          items: [
            { caption: 'Alpha', value: 'Alpha', checked: overrides?.secondSourceDefaultValue === 'Alpha' },
            { caption: 'Beta', value: 'Beta', checked: overrides?.secondSourceDefaultValue === 'Beta' }
          ]
        }
      },
      {
        key: 'dependent',
        contentType: 'TextboxElementBlock',
        displayName: 'Dependent',
        locale: 'en',
        localizations: {},
        properties: {
          label: 'Shared Ownership (Yes TextArea)',
          description: '',
          validators: [
            {
              type: 'RequiredValidator',
              validationOrder: 0,
              description: 'Required',
              model: { message: 'Required.', validationCssClass: '', additionalAttributes: {} }
            }
          ],
          conditions: overrides?.conditions ?? [{ field: 'source', operator: 'Equals', fieldValue: 'Yes' }],
          conditionCombination: overrides?.conditionCombination ?? 'All',
          satisfiedAction: 'show'
        }
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
}

function createRawConditionalForm(): any {
  return {
    key: 'raw-conditional-form',
    locale: 'en',
    localizations: {},
    properties: {
      title: 'Raw conditional form',
      allowToStoreSubmissionData: true,
      showSummarizedData: false,
      confirmationMessage: '',
      resetConfirmationMessage: '',
      redirectToPage: '',
      submitSuccessMessage: 'Thanks.',
      allowAnonymousSubmission: true,
      allowMultipleSubmission: true,
      showNavigationBar: true,
      description: '',
      metadataAttribute: '',
      focusOnForm: false
    },
    formElements: [
      {
        key: 'step-1',
        contentType: 'FormStepBlock',
        displayName: 'Step one',
        locale: 'en',
        localizations: {},
        properties: { label: 'Step one', description: '' }
      },
      {
        key: 'source-guid',
        contentType: 'SelectionElementBlock',
        displayName: 'Source',
        locale: 'en',
        localizations: { selectionDefaultPlaceholder: 'Select an option' },
        properties: {
          label: 'Source',
          description: '',
          contentLinkId: 31796,
          items: [
            { caption: 'Yes', value: 'Yes', checked: false },
            { caption: 'No', value: 'No', checked: false }
          ]
        }
      },
      {
        key: 'dependent-guid',
        contentType: 'TextboxElementBlock',
        displayName: 'Dependent',
        locale: 'en',
        localizations: {},
        properties: {
          label: 'Shared Ownership (Yes TextArea)',
          description: '',
          contentLinkId: 31799,
          Conditions: [{ field: { id: 31796 }, operator: 2, fieldValue: 'Yes' }],
          ConditionCombination: 0,
          SatisfiedAction: 'Show'
        }
      }
    ],
    steps: []
  } as any;
}

describe('FormContainerComponent', () => {
  const submissionService = jasmine.createSpyObj<FormSubmissionService>('FormSubmissionService', [
    'toFormSubmissions',
    'collectCurrentStepSubmissions',
    'validateStep',
    'clearValidationResults',
    'applyValidationResults',
    'buildSubmitModel',
    'submit',
    'firstInvalidControlKey',
    'applyServerValidation'
  ]);
  const confirmationService = jasmine.createSpyObj<FormConfirmationService>('FormConfirmationService', ['buildSummary']);
  const navigationService = jasmine.createSpyObj<FormNavigationService>('FormNavigationService', [
    'resolveInitialStepIndex',
    'findPreviousStep',
    'findNextStep',
    'isStepValidToDisplay',
    'isMalFormSteps',
    'goToStep',
    'clearNavigationState',
    'loadDraft',
    'saveDraft'
  ]);

  function serializeValue(value: unknown): unknown {
    return Array.isArray(value) ? value.join(',') : value;
  }

  beforeEach(async () => {
    submissionService.toFormSubmissions.and.callFake((form: any, formGroup: FormGroup) =>
      (form.formElements ?? [])
        .filter((field: any) => field.contentType !== 'FormStepBlock')
        .map((field: any) => ({
          elementKey: field.key,
          value: serializeValue(formGroup.get(field.key)?.value)
        }))
    );
    submissionService.collectCurrentStepSubmissions.and.callFake((form: any, formGroup: FormGroup, currentStepIndex: number, inactiveElements: string[]) => {
      const currentStepKeys = new Set((form.steps?.[currentStepIndex]?.elements ?? []).filter((field: any) => field.contentType !== 'FormStepBlock').map((field: any) => field.key));

      return submissionService
        .toFormSubmissions(form, formGroup)
        .filter((submission: any) => currentStepKeys.has(submission.elementKey) && !inactiveElements.includes(submission.elementKey));
    });
    submissionService.validateStep.and.returnValue([]);
    submissionService.clearValidationResults.and.returnValue(undefined);
    submissionService.applyValidationResults.and.returnValue(undefined);
    submissionService.buildSubmitModel.and.returnValue({
      formKey: 'support-request',
      locale: 'en',
      submissionData: [{ elementKey: 'firstName', value: 'Ada' }],
      isFinalized: false,
      partialSubmissionKey: '',
      hostedPageUrl: 'https://app.example/forms/container',
      currentStepIndex: 0
    });
    submissionService.submit.and.returnValue(of({ success: true, submissionKey: 'sub-123', validationFail: false, messages: [] }));
    submissionService.firstInvalidControlKey.and.returnValue('firstName');
    confirmationService.buildSummary.and.returnValue('Details: preserve behavior.');
    navigationService.resolveInitialStepIndex.and.returnValue(0);
    navigationService.findPreviousStep.and.returnValue(0);
    navigationService.findNextStep.and.returnValue(1);
    navigationService.isStepValidToDisplay.and.returnValue(true);
    navigationService.isMalFormSteps.and.returnValue(false);

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
    submissionService.validateStep.and.returnValue([{ elementKey: 'firstName', result: { valid: false, message: 'First name is required.' } }]);

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

  it('hides a dependent field by default and keeps hidden required fields from making the form invalid', () => {
    const fixture = TestBed.createComponent(FormContainerComponent);
    fixture.componentRef.setInput('form', createConditionalForm());
    fixture.componentRef.setInput('baseUrl', 'https://cms.example/');
    fixture.componentRef.setInput('currentPageUrl', 'https://app.example/forms/conditional');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Shared Ownership (Yes TextArea)');
    expect((fixture.componentInstance as any).formGroup.get('dependent')?.disabled).toBe(true);
    expect((fixture.componentInstance as any).formGroup.valid).toBe(true);
  });

  it('shows and hides the dependent field again when the source value changes', () => {
    const fixture = TestBed.createComponent(FormContainerComponent);
    fixture.componentRef.setInput('form', createConditionalForm());
    fixture.componentRef.setInput('baseUrl', 'https://cms.example/');
    fixture.componentRef.setInput('currentPageUrl', 'https://app.example/forms/conditional');
    fixture.detectChanges();

    const formGroup = (fixture.componentInstance as any).formGroup;
    formGroup.get('source')?.setValue('Yes');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Shared Ownership (Yes TextArea)');
    expect(formGroup.get('dependent')?.disabled).toBe(false);

    formGroup.get('source')?.setValue('No');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Shared Ownership (Yes TextArea)');
    expect(formGroup.get('dependent')?.disabled).toBe(true);
  });

  it('shows dependent fields from the initial preselected value', () => {
    const fixture = TestBed.createComponent(FormContainerComponent);
    fixture.componentRef.setInput('form', createConditionalForm({ sourceDefaultValue: 'Yes' }));
    fixture.componentRef.setInput('baseUrl', 'https://cms.example/');
    fixture.componentRef.setInput('currentPageUrl', 'https://app.example/forms/conditional');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Shared Ownership (Yes TextArea)');
  });

  it('updates visibility for patchValue and setValue', () => {
    const fixture = TestBed.createComponent(FormContainerComponent);
    fixture.componentRef.setInput('form', createConditionalForm());
    fixture.componentRef.setInput('baseUrl', 'https://cms.example/');
    fixture.componentRef.setInput('currentPageUrl', 'https://app.example/forms/conditional');
    fixture.detectChanges();

    const formGroup = (fixture.componentInstance as any).formGroup;
    formGroup.get('source')?.patchValue('Yes');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Shared Ownership (Yes TextArea)');

    formGroup.get('source')?.setValue('No');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Shared Ownership (Yes TextArea)');
  });

  it('supports multiple conditions with AND logic', () => {
    const fixture = TestBed.createComponent(FormContainerComponent);
    fixture.componentRef.setInput(
      'form',
      createConditionalForm({
        conditions: [
          { field: 'source', operator: 'Equals', fieldValue: 'Yes' },
          { field: 'source-2', operator: 'Equals', fieldValue: 'Alpha' }
        ],
        conditionCombination: 'All'
      })
    );
    fixture.componentRef.setInput('baseUrl', 'https://cms.example/');
    fixture.componentRef.setInput('currentPageUrl', 'https://app.example/forms/conditional');
    fixture.detectChanges();

    const formGroup = (fixture.componentInstance as any).formGroup;
    formGroup.patchValue({ source: 'Yes', 'source-2': 'Beta' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Shared Ownership (Yes TextArea)');

    formGroup.patchValue({ 'source-2': 'Alpha' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Shared Ownership (Yes TextArea)');
  });

  it('supports multiple conditions with OR logic', () => {
    const fixture = TestBed.createComponent(FormContainerComponent);
    fixture.componentRef.setInput(
      'form',
      createConditionalForm({
        conditions: [
          { field: 'source', operator: 'Equals', fieldValue: 'Yes' },
          { field: 'source-2', operator: 'Equals', fieldValue: 'Alpha' }
        ],
        conditionCombination: 'Any'
      })
    );
    fixture.componentRef.setInput('baseUrl', 'https://cms.example/');
    fixture.componentRef.setInput('currentPageUrl', 'https://app.example/forms/conditional');
    fixture.detectChanges();

    const formGroup = (fixture.componentInstance as any).formGroup;
    formGroup.patchValue({ source: 'No', 'source-2': 'Alpha' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Shared Ownership (Yes TextArea)');
  });

  it('treats missing conditions and missing source fields safely', () => {
    const fixture = TestBed.createComponent(FormContainerComponent);
    fixture.componentRef.setInput(
      'form',
      createConditionalForm({
        conditions: [{ field: 'missing-source', operator: 'Equals', fieldValue: 'Yes' }]
      })
    );
    fixture.componentRef.setInput('baseUrl', 'https://cms.example/');
    fixture.componentRef.setInput('currentPageUrl', 'https://app.example/forms/conditional');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Shared Ownership (Yes TextArea)');
    expect((fixture.componentInstance as any).formGroup.get('dependent')?.disabled).toBe(true);
  });

  it('cleans up the form valueChanges subscription on destroy', () => {
    const fixture = TestBed.createComponent(FormContainerComponent);
    fixture.componentRef.setInput('form', createConditionalForm());
    fixture.componentRef.setInput('baseUrl', 'https://cms.example/');
    fixture.componentRef.setInput('currentPageUrl', 'https://app.example/forms/conditional');
    fixture.detectChanges();

    fixture.destroy();

    expect((fixture.componentInstance as any).formGroupSubscription?.closed).toBe(true);
  });

  it('supports raw Episerver-style Conditions metadata in the shared library form container', () => {
    const fixture = TestBed.createComponent(FormContainerComponent);
    fixture.componentRef.setInput('form', createRawConditionalForm());
    fixture.componentRef.setInput('baseUrl', 'https://cms.example/');
    fixture.componentRef.setInput('currentPageUrl', 'https://app.example/forms/raw-conditional');
    fixture.detectChanges();

    const formGroup = (fixture.componentInstance as any).formGroup;
    expect(fixture.nativeElement.textContent).not.toContain('Shared Ownership (Yes TextArea)');

    formGroup.get('source-guid')?.setValue('Yes');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Shared Ownership (Yes TextArea)');
  });
});
