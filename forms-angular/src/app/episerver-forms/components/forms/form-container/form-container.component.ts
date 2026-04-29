import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, computed, effect, input, output, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormSchema, FormStep, FormSubmissionResult, IdentityInfo } from '../../../models/form-schema.model';
import { FormConfirmationService } from '../../../services/form-confirmation.service';
import { FormNavigationService } from '../../../services/form-navigation.service';
import { FormSchemaFormService } from '../../../services/form-schema-form.service';
import { FormSubmissionService } from '../../../services/form-submission.service';
import { DynamicFieldComponent } from '../dynamic-field/dynamic-field.component';
import { FormStepNavigationComponent } from '../form-step-navigation/form-step-navigation.component';

@Component({
  selector: 'lib-form-container',
  standalone: false,
  templateUrl: './form-container.component.html',
  styleUrl: './form-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormContainerComponent {
  readonly form = input.required<FormSchema>();
  readonly baseUrl = input('');
  readonly currentPageUrl = input('');
  readonly identityInfo = input<IdentityInfo | undefined>(undefined);
  readonly hideFormOnSuccess = input(true);

  readonly submitted = output<FormSubmissionResult>();
  readonly submissionError = output<unknown>();

  protected readonly currentStepIndex = signal(0);
  protected readonly isSubmitting = signal(false);
  protected readonly hasSubmitted = signal(false);
  protected readonly statusMessage = signal('');
  protected readonly submitSucceeded = signal(false);
  protected readonly isWarningStatus = signal(false);
  protected readonly isFormFinalized = signal(false);
  protected readonly storedSubmissionKey = signal('');
  protected readonly formGroup = signal(new FormGroup({}));
  protected readonly steps = signal<FormStep[]>([]);
  private initialValue: Record<string, unknown> = {};

  protected readonly currentStep = computed(() => this.steps()[this.currentStepIndex()] ?? null);
  protected readonly hasMultipleSteps = computed(() => this.steps().length > 1);
  protected readonly canGoPrevious = computed(() => this.currentStepIndex() > 0);
  protected readonly canGoNext = computed(() => this.currentStepIndex() < this.steps().length - 1);
  protected readonly nextButtonLabel = computed(
    () => this.form().localizations?.['nextButtonLabel'] || this.currentStep()?.formStep.localizations?.['nextButtonLabel'] || 'Next'
  );
  protected readonly previousButtonLabel = computed(
    () =>
      this.form().localizations?.['previousButtonLabel'] ||
      this.currentStep()?.formStep.localizations?.['previousButtonLabel'] ||
      'Previous'
  );
  protected readonly progressLabel = computed(
    () => this.form().localizations?.['pageButtonLabel'] || this.currentStep()?.formStep.localizations?.['pageButtonLabel'] || 'Page'
  );
  protected readonly showFormBody = computed(() => !(this.hideFormOnSuccess() && this.submitSucceeded()));
  protected readonly validationCssClass = computed(() => (this.hasSubmitted() && this.formGroup().invalid ? 'ValidationFail' : 'ValidationSuccess'));

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly formConfirmationService: FormConfirmationService,
    private readonly formNavigationService: FormNavigationService,
    private readonly formSchemaFormService: FormSchemaFormService,
    private readonly formSubmissionService: FormSubmissionService
  ) {
    effect(() => {
      const builtForm = this.formSchemaFormService.buildForm(this.form());
      const savedDraft = this.formNavigationService.loadDraft(this.form().key);
      if (savedDraft) {
        builtForm.formGroup.patchValue(savedDraft);
      }
      this.formGroup.set(builtForm.formGroup);
      this.steps.set(builtForm.steps);
      this.initialValue = builtForm.initialValue;
      this.currentStepIndex.set(this.formNavigationService.resolveInitialStepIndex(this.form(), this.currentPageUrl()));
      this.hasSubmitted.set(false);
      this.submitSucceeded.set(false);
      this.statusMessage.set('');
      this.isWarningStatus.set(false);
      this.isFormFinalized.set(false);
      this.storedSubmissionKey.set('');
    });

    effect(() => {
      if (this.identityInfo()?.accessToken || this.form().properties.allowAnonymousSubmission !== false) {
        if (!this.submitSucceeded()) {
          this.clearStatusMessage();
        }
        return;
      }

      this.setWarningStatus(this.form().localizations?.['allowAnonymousSubmissionErrorMessage'] || 'Authentication is required.');
    });
  }

  protected previousStep(): void {
    if (this.canGoPrevious()) {
      const previousStepIndex = this.formNavigationService.findPreviousStep(this.form(), this.currentStepIndex());
      this.currentStepIndex.set(previousStepIndex);
      this.formNavigationService.goToStep(this.form(), previousStepIndex, this.formGroup());
    }
  }

  protected nextStep(): void {
    const step = this.currentStep();
    if (!step) {
      return;
    }

    const controls = step.elements
      .filter((field) => field.contentType !== 'FormStepBlock')
      .map((field) => this.formGroup().get(field.key))
      .filter((control) => !!control);

    controls.forEach((control) => control?.markAsTouched());

    if (controls.some((control) => control?.invalid)) {
      this.hasSubmitted.set(true);
      this.focusFirstInvalidControl();
      return;
    }

    if (this.canGoNext()) {
      const nextStepIndex = this.formNavigationService.findNextStep(this.form(), this.currentStepIndex());
      this.currentStepIndex.set(nextStepIndex);
      this.formNavigationService.goToStep(this.form(), nextStepIndex, this.formGroup());
    }
  }

  protected handleReset(): void {
    this.formGroup().reset(this.initialValue);
    this.currentStepIndex.set(0);
    this.hasSubmitted.set(false);
    this.submitSucceeded.set(false);
    this.clearStatusMessage();
    this.isFormFinalized.set(false);
    this.storedSubmissionKey.set('');
    this.formNavigationService.clearNavigationState(this.form().key);
  }

  protected submitForm(): void {
    this.hasSubmitted.set(true);

    if (!this.canSubmitAnonymously()) {
      this.setWarningStatus(this.form().localizations?.['allowAnonymousSubmissionErrorMessage'] || 'Authentication is required.');
      return;
    }

    const invalid = this.formSubmissionService.ensureValid(this.formGroup());
    if (invalid) {
      invalid.subscribe({ error: () => undefined });
      this.focusFirstInvalidControl();
      return;
    }

    if (!this.confirmSubmission()) {
      return;
    }

    if (!this.baseUrl()) {
      this.setWarningStatus('No base URL configured for form submission.');
      return;
    }

    this.isSubmitting.set(true);
    const payload = this.formSubmissionService.buildSubmissionData(
      this.form(),
      this.formGroup(),
      this.currentStepIndex(),
      this.currentPageUrl(),
      this.identityInfo()?.accessToken,
      true,
      this.storedSubmissionKey()
    );

    this.formSubmissionService.submit(this.baseUrl(), payload).subscribe({
      next: (result) => {
        this.storedSubmissionKey.set(result.submissionKey ?? '');
        this.isFormFinalized.set(result.success);
        this.submitSucceeded.set(result.success);
        this.isWarningStatus.set(false);
        this.statusMessage.set(
          this.form().properties.submitSuccessMessage || result.messages?.map((message) => message.message).join('<br>') || ''
        );
        this.submitted.emit(result);
        this.isSubmitting.set(false);
        this.formNavigationService.clearNavigationState(this.form().key);
        this.redirectIfConfigured();
      },
      error: (error) => {
        this.formSubmissionService.applyServerValidation(this.formGroup(), error);
        this.setWarningStatus(error?.detail || 'Form submission failed.');
        this.submissionError.emit(error);
        this.isSubmitting.set(false);
        this.focusFirstInvalidControl();
      }
    });
  }

  private focusFirstInvalidControl(): void {
    const invalidKey = this.formSubmissionService.firstInvalidControlKey(this.formGroup());
    if (!invalidKey) {
      return;
    }

    const invalidElement = this.document.getElementById(invalidKey) as HTMLElement | null;
    invalidElement?.focus();
  }

  private confirmSubmission(): boolean {
    const confirmationMessage = this.form().properties.confirmationMessage ?? '';
    if (!confirmationMessage && !this.form().properties.showSummarizedData) {
      return true;
    }

    const summary = this.form().properties.showSummarizedData
      ? this.formConfirmationService.buildSummary(this.form(), this.formGroup(), this.currentStepIndex())
      : '';
    const prompt = [confirmationMessage, summary].filter(Boolean).join('\n\n');
    if (!prompt) {
      return true;
    }

    return this.document.defaultView?.confirm(prompt) ?? true;
  }

  private canSubmitAnonymously(): boolean {
    return this.form().properties.allowAnonymousSubmission !== false || !!this.identityInfo()?.accessToken;
  }

  private clearStatusMessage(): void {
    this.statusMessage.set('');
    this.isWarningStatus.set(false);
  }

  private setWarningStatus(message: string): void {
    this.submitSucceeded.set(false);
    this.isWarningStatus.set(true);
    this.statusMessage.set(message);
  }

  private redirectIfConfigured(): void {
    const redirectToPage = this.form().properties.redirectToPage;
    if (!redirectToPage || !this.document.defaultView) {
      return;
    }

    const target = new URL(redirectToPage, this.document.location?.href || this.document.baseURI);
    this.document.defaultView.location.assign(target.href);
  }
}
