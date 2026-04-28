import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { FormConfirmationService } from '../../../services/form-confirmation.service';
import { FormNavigationService } from '../../../services/form-navigation.service';
import { FormSubmissionService } from '../../../services/form-submission.service';
import { FormContainerComponent } from './form-container.component';
import { sampleSupportRequestForm } from '../../../../features/forms/pages/form-container-page/form-container-page.schema';

describe('FormContainerComponent', () => {
  const submissionService = {
    ensureValid: vi.fn(),
    buildSubmissionData: vi.fn(),
    submit: vi.fn(),
    firstInvalidControlKey: vi.fn(),
    applyServerValidation: vi.fn()
  } as unknown as FormSubmissionService;
  const confirmationService = {
    buildSummary: vi.fn()
  } as unknown as FormConfirmationService;
  const navigationService = {
    loadDraft: vi.fn(),
    resolveInitialStepIndex: vi.fn(),
    findPreviousStep: vi.fn(),
    findNextStep: vi.fn(),
    goToStep: vi.fn(),
    clearNavigationState: vi.fn()
  } as unknown as FormNavigationService;

  beforeEach(async () => {
    vi.mocked(submissionService.ensureValid).mockReset();
    vi.mocked(submissionService.buildSubmissionData).mockReset();
    vi.mocked(submissionService.submit).mockReset();
    vi.mocked(submissionService.firstInvalidControlKey).mockReset();
    vi.mocked(submissionService.applyServerValidation).mockReset();
    vi.mocked(confirmationService.buildSummary).mockReset();
    vi.mocked(navigationService.loadDraft).mockReset();
    vi.mocked(navigationService.resolveInitialStepIndex).mockReset();
    vi.mocked(navigationService.findPreviousStep).mockReset();
    vi.mocked(navigationService.findNextStep).mockReset();
    vi.mocked(navigationService.goToStep).mockReset();
    vi.mocked(navigationService.clearNavigationState).mockReset();

    vi.mocked(submissionService.ensureValid).mockReturnValue(null);
    vi.mocked(submissionService.buildSubmissionData).mockReturnValue({
      formKey: sampleSupportRequestForm.key,
      locale: sampleSupportRequestForm.locale,
      fields: {},
      isFinalized: true,
      currentStepIndex: 1
    });
    vi.mocked(submissionService.submit).mockReturnValue(
      of({
        success: true,
        submissionKey: 'sub-123',
        messages: [{ message: 'Submitted' }]
      })
    );
    vi.mocked(submissionService.firstInvalidControlKey).mockReturnValue('firstName');
    vi.mocked(confirmationService.buildSummary).mockReturnValue('Details: Please preserve validation.');
    vi.mocked(navigationService.loadDraft).mockReturnValue(null);
    vi.mocked(navigationService.resolveInitialStepIndex).mockReturnValue(0);
    vi.mocked(navigationService.findPreviousStep).mockImplementation((_form, stepIndex) => Math.max(stepIndex - 1, 0));
    vi.mocked(navigationService.findNextStep).mockImplementation((_form, stepIndex) => Math.min(stepIndex + 1, 1));

    await TestBed.configureTestingModule({
      imports: [FormContainerComponent],
      providers: [
        { provide: FormSubmissionService, useValue: submissionService },
        { provide: FormConfirmationService, useValue: confirmationService },
        { provide: FormNavigationService, useValue: navigationService }
      ]
    }).compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(FormContainerComponent);
    fixture.componentRef.setInput('form', sampleSupportRequestForm);
    fixture.componentRef.setInput('baseUrl', 'https://cms.example/');
    fixture.componentRef.setInput('currentPageUrl', 'https://app.example/forms/container');
    fixture.detectChanges();
    return fixture;
  }

  function fillFirstStep(host: HTMLElement) {
    const firstNameInput = host.querySelector('#firstName') as HTMLInputElement;
    firstNameInput.value = 'Ada';
    firstNameInput.dispatchEvent(new Event('input'));

    const emailInput = host.querySelector('#emailAddress') as HTMLInputElement;
    emailInput.value = 'ada@example.com';
    emailInput.dispatchEvent(new Event('input'));

    const interestCheckbox = host.querySelector('#interests_0') as HTMLInputElement;
    interestCheckbox.checked = true;
    interestCheckbox.dispatchEvent(new Event('change'));

    const reasonSelect = host.querySelector('#contactReason') as HTMLSelectElement;
    reasonSelect.value = 'migration';
    reasonSelect.dispatchEvent(new Event('change'));
  }

  it('renders the first-step fields in the original schema order', () => {
    const fixture = createComponent();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.Form__Element__Caption, .FormStep__Title') as NodeListOf<HTMLElement>
    )
      .map((element) => (element.textContent || '').trim())
      .filter(Boolean);

    expect(labels.slice(0, 5)).toEqual(['About you', 'First name', 'Email address', 'Topics', 'How can we help?']);
  });

  it('blocks step navigation when required fields are invalid and focuses the first invalid control', () => {
    const fixture = createComponent();
    const nextButton = fixture.nativeElement.querySelector('.btnNext') as HTMLButtonElement;
    const firstNameInput = fixture.nativeElement.querySelector('#firstName') as HTMLInputElement;

    nextButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('First name is required.');
    expect(fixture.nativeElement.textContent).toContain('Email is required.');
    expect(document.activeElement).toBe(firstNameInput);
    expect(fixture.nativeElement.textContent).toContain('About you');
    expect(vi.mocked(navigationService.goToStep)).not.toHaveBeenCalled();
  });

  it('submits successfully, keeps the payload contract, and shows the thank-you status', () => {
    const fixture = createComponent();
    const host = fixture.nativeElement as HTMLElement;

    fillFirstStep(host);
    fixture.detectChanges();

    (host.querySelector('.btnNext') as HTMLButtonElement).click();
    fixture.detectChanges();

    const detailsInput = host.querySelector('#details') as HTMLTextAreaElement;
    detailsInput.value = 'Please preserve validation, order, and thank-you behavior.';
    detailsInput.dispatchEvent(new Event('input'));

    const websiteInput = host.querySelector('#website') as HTMLInputElement;
    websiteInput.value = 'https://example.com/current-form';
    websiteInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (host.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(vi.mocked(submissionService.buildSubmissionData)).toHaveBeenCalled();
    expect(vi.mocked(submissionService.submit)).toHaveBeenCalled();
    expect(host.querySelector('.Form__Status__Message')?.textContent).toContain('Thanks.');
    expect(host.querySelector('.Form__MainBody')).toBeNull();
    expect(vi.mocked(navigationService.clearNavigationState)).toHaveBeenCalledWith(sampleSupportRequestForm.key);
  });

  it('blocks anonymous submission when the form requires an authenticated identity', () => {
    const fixture = createComponent();
    const host = fixture.nativeElement as HTMLElement;
    const gatedForm = {
      ...sampleSupportRequestForm,
      properties: {
        ...sampleSupportRequestForm.properties,
        allowAnonymousSubmission: false
      },
      localizations: {
        ...sampleSupportRequestForm.localizations,
        allowAnonymousSubmissionErrorMessage: 'Please sign in before submitting.'
      }
    };

    fixture.componentRef.setInput('form', gatedForm);
    fixture.detectChanges();

    expect(host.textContent).toContain('Please sign in before submitting.');
    expect(vi.mocked(submissionService.submit)).not.toHaveBeenCalled();
  });

  it('asks for confirmation with summarized data before final submit', () => {
    const fixture = createComponent();
    const host = fixture.nativeElement as HTMLElement;
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const confirmForm = {
      ...sampleSupportRequestForm,
      properties: {
        ...sampleSupportRequestForm.properties,
        confirmationMessage: 'Ready to submit?',
        showSummarizedData: true
      }
    };

    fixture.componentRef.setInput('form', confirmForm);
    fixture.detectChanges();

    fillFirstStep(host);
    fixture.detectChanges();
    (host.querySelector('.btnNext') as HTMLButtonElement).click();
    fixture.detectChanges();

    const detailsInput = host.querySelector('#details') as HTMLTextAreaElement;
    detailsInput.value = 'Please preserve validation, order, and thank-you behavior.';
    detailsInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (host.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(vi.mocked(confirmationService.buildSummary)).toHaveBeenCalled();
    expect(confirmSpy).toHaveBeenCalledWith('Ready to submit?\n\nDetails: Please preserve validation.');
    expect(vi.mocked(submissionService.submit)).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('uses the navigation service to move to the next step and persist route state', () => {
    const fixture = createComponent();
    const host = fixture.nativeElement as HTMLElement;

    fillFirstStep(host);
    fixture.detectChanges();

    (host.querySelector('.btnNext') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(vi.mocked(navigationService.findNextStep)).toHaveBeenCalledWith(sampleSupportRequestForm, 0);
    expect(vi.mocked(navigationService.goToStep)).toHaveBeenCalledWith(sampleSupportRequestForm, 1, expect.anything());
  });
});
