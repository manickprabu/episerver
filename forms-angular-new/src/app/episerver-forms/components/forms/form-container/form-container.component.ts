import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, Inject, computed, effect, input, output, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';

import {
  FormConstants,
  FormDependConditionsService,
  FormStateInitService,
  FormSubmission,
  FormValidationResult,
  StepHelperService,
  htmlDecodeEntities
} from '../../../episerver-sdk';
import { FormSchema, FormServerValidationError, FormSubmissionResult, IdentityInfo } from '../../../models/form-schema.model';
import { FormAuthService } from '../../../services/form-auth.service';
import { FormConfirmationService } from '../../../services/form-confirmation.service';
import { FormNavigationService } from '../../../services/form-navigation.service';
import { FormSchemaFormService } from '../../../services/form-schema-form.service';
import { FormSubmissionService } from '../../../services/form-submission.service';

@Component({
  selector: 'lib-form-container',
  standalone: false,
  templateUrl: './form-container.component.html',
  styleUrls: ['./form-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormContainerComponent {
  readonly form = input.required<FormSchema>();
  readonly baseUrl = input('');
  readonly currentPageUrl = input('');
  readonly identityInfo = input<IdentityInfo | undefined>(undefined);
  readonly history = input<unknown>(undefined);
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
  protected readonly isProgressiveSubmit = signal(false);
  protected readonly storedSubmissionKey = signal('');
  protected readonly formGroup = signal(new FormGroup({}));
  protected readonly steps = signal<FormSchema['steps']>([]);
  protected readonly resolvedForm = signal<FormSchema | null>(null);
  protected readonly dependencyInactiveElements = signal<string[]>([]);
  protected readonly elementDependencies = signal<Array<{ elementKey: string; isSatisfied: boolean; sastisfiedAction?: string }>>([]);

  private initialValue: Record<string, unknown> = {};
  private stepStorageKey = '';

  protected readonly currentStep = computed(() => this.steps()[this.currentStepIndex()] ?? null);
  protected readonly hasMultipleSteps = computed(() => this.steps().length > 1);
  protected readonly canGoPrevious = computed(() => this.currentStepIndex() > 0);
  protected readonly canGoNext = computed(() => this.currentStepIndex() < this.steps().length - 1);
  protected readonly nextButtonLabel = computed(
    () => this.resolvedForm()?.localizations?.['nextButtonLabel'] || this.currentStep()?.formStep.localizations?.['nextButtonLabel'] || 'Next'
  );
  protected readonly previousButtonLabel = computed(
    () => this.resolvedForm()?.localizations?.['previousButtonLabel'] || this.currentStep()?.formStep.localizations?.['previousButtonLabel'] || 'Previous'
  );
  protected readonly progressLabel = computed(
    () => this.resolvedForm()?.localizations?.['pageButtonLabel'] || this.currentStep()?.formStep.localizations?.['pageButtonLabel'] || 'Page'
  );
  protected readonly isMalFormSteps = computed(() => (this.resolvedForm() ? this.formNavigationService.isMalFormSteps(this.resolvedForm()!) : false));
  protected readonly isStepValidToDisplay = computed(() => {
    const form = this.resolvedForm();
    if (!form) {
      return false;
    }

    return this.formNavigationService.isStepValidToDisplay(
      form,
      this.currentStepIndex(),
      this.currentPageUrl() || this.document.location?.href || '/',
      this.dependencyInactiveElements()
    );
  });
  protected readonly showFormBody = computed(
    () => !((this.hideFormOnSuccess() && this.submitSucceeded()) || (this.isProgressiveSubmit() && this.submitSucceeded()))
  );
  protected readonly validationCssClass = computed(() => (this.hasSubmitted() && this.formGroup().invalid ? 'ValidationFail' : 'ValidationSuccess'));

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly destroyRef: DestroyRef,
    private readonly formAuthService: FormAuthService,
    private readonly formConfirmationService: FormConfirmationService,
    private readonly formDependConditionsService: FormDependConditionsService,
    private readonly formNavigationService: FormNavigationService,
    private readonly formSchemaFormService: FormSchemaFormService,
    private readonly formStateInitService: FormStateInitService,
    private readonly formSubmissionService: FormSubmissionService,
    private readonly stepHelperService: StepHelperService
  ) {
    effect(() => {
      const builtForm = this.formSchemaFormService.buildForm(this.form());
      this.resolvedForm.set(builtForm.form);
      this.formGroup.set(builtForm.formGroup);
      this.steps.set(builtForm.steps);
      this.initialValue = builtForm.initialValue;
      this.stepStorageKey = FormConstants.FormSubmissionId + builtForm.form.key;

      const state = this.formStateInitService.initFormState(
        builtForm.form,
        this.currentPageUrl() || this.document.location?.href || '/',
        this.history()
      );

      this.elementDependencies.set(state.elementDependencies);
      this.currentStepIndex.set(state.currentStepIndex);
      this.patchDraftValues(state.formSubmissions);
      this.storedSubmissionKey.set(this.readStoredSubmissionKey());
      this.hasSubmitted.set(false);
      this.submitSucceeded.set(false);
      this.isProgressiveSubmit.set(false);
      this.isWarningStatus.set(false);
      this.statusMessage.set('');
      this.isFormFinalized.set(false);
      this.refreshDependencies();

      const subscription = builtForm.formGroup.valueChanges.subscribe(() => this.refreshDependencies());
      this.destroyRef.onDestroy(() => subscription.unsubscribe());
    });

    effect(() => {
      const form = this.resolvedForm();
      if (!form) {
        return;
      }

      if (!this.isStepValidToDisplay()) {
        this.currentStepIndex.set(
          this.formNavigationService.resolveInitialStepIndex(form, this.currentPageUrl() || this.document.location?.href || '/')
        );
      }

      if (this.isMalFormSteps()) {
        this.setWarningStatus(form.localizations?.['malformstepconfigruationErrorMessage'] || 'Form step configuration is invalid.');
      } else if (this.identityInfo()?.accessToken || form.properties.allowAnonymousSubmission !== false) {
        if (!this.submitSucceeded()) {
          this.clearStatusMessage();
        }
      } else {
        this.setWarningStatus(form.localizations?.['allowAnonymousSubmissionErrorMessage'] || 'Authentication is required.');
      }
    });

    effect(() => {
      const form = this.resolvedForm();
      if (!form || this.isMalFormSteps() || !this.isStepValidToDisplay()) {
        return;
      }

      if (!(form.properties.focusOnForm || this.currentStepIndex() > 0)) {
        return;
      }

      const firstInputKey = this.stepHelperService.getFirstInputElement(
        form,
        this.currentStepIndex(),
        this.dependencyInactiveElements()
      );

      if (!firstInputKey) {
        return;
      }

      queueMicrotask(() => {
        const target = this.document.getElementById(firstInputKey) as HTMLElement | null;
        target?.focus();
      });
    });
  }

  protected previousStep(): void {
    const form = this.resolvedForm();
    if (!form || !this.canGoPrevious()) {
      return;
    }

    const previousStepIndex = this.formNavigationService.findPreviousStep(
      form,
      this.currentStepIndex(),
      this.dependencyInactiveElements()
    );

    this.currentStepIndex.set(previousStepIndex);
    this.formNavigationService.goToStep(form, previousStepIndex, this.currentSubmissions(), this.asHistory());
  }

  protected nextStep(): void {
    const form = this.resolvedForm();
    if (!form || !this.canGoNext()) {
      return;
    }

    if (!this.canSubmitAnonymously(form)) {
      this.setWarningStatus(form.localizations?.['allowAnonymousSubmissionErrorMessage'] || 'Authentication is required.');
      return;
    }

    const currentStepSubmissions = this.currentStepSubmissions();
    const validationResults = this.formSubmissionService.validateStep(form, currentStepSubmissions);
    this.applyValidationAndMaybeFocus(validationResults, currentStepSubmissions);

    if (validationResults.some((result) => !result.result.valid)) {
      return;
    }

    const nextStepIndex = this.formNavigationService.findNextStep(form, this.currentStepIndex(), this.dependencyInactiveElements());

    if (!this.baseUrl()) {
      this.formNavigationService.goToStep(form, nextStepIndex, this.currentSubmissions(), this.asHistory());
      this.currentStepIndex.set(nextStepIndex);
      return;
    }

    this.isSubmitting.set(true);
    const model = this.formSubmissionService.buildSubmitModel(
      form,
      currentStepSubmissions,
      this.currentStepIndex(),
      this.currentPageUrl() || this.document.location?.href || '/',
      this.identityInfo()?.accessToken,
      false,
      this.storedSubmissionKey()
    );

    this.formSubmissionService.submit(form, this.baseUrl(), model).subscribe({
      next: (result) => {
        this.storeSubmissionKey(result.submissionKey);
        this.currentStepIndex.set(nextStepIndex);
        this.formNavigationService.goToStep(form, nextStepIndex, this.currentSubmissions(), this.asHistory());
        this.submitSucceeded.set(true);
        this.isWarningStatus.set(false);
        this.statusMessage.set('');
        this.isSubmitting.set(false);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.handleSubmitError(error);
      }
    });
  }

  protected handleReset(): void {
    const form = this.resolvedForm();
    if (!form) {
      return;
    }

    const confirmationMessage = form.properties.resetConfirmationMessage ?? '';
    if (confirmationMessage && !(this.document.defaultView?.confirm(htmlDecodeEntities(confirmationMessage)) ?? true)) {
      return;
    }

    this.formGroup().reset(this.initialValue);
    this.currentStepIndex.set(0);
    this.hasSubmitted.set(false);
    this.submitSucceeded.set(false);
    this.isProgressiveSubmit.set(false);
    this.clearStatusMessage();
    this.isFormFinalized.set(false);
    this.storedSubmissionKey.set('');
    this.clearStoredSubmissionKey();
    this.formNavigationService.clearNavigationState(form);
    this.refreshDependencies();

    if (form.steps.length > 0) {
      this.formNavigationService.goToStep(form, 0, this.currentSubmissions(), this.asHistory());
    }
  }

  protected submitForm(event?: SubmitEvent): void {
    const form = this.resolvedForm();
    if (!form) {
      return;
    }

    this.hasSubmitted.set(true);

    if (!this.canSubmitAnonymously(form)) {
      this.setWarningStatus(form.localizations?.['allowAnonymousSubmissionErrorMessage'] || 'Authentication is required.');
      return;
    }

    const submitButtonId = (event?.submitter as HTMLButtonElement | null)?.id ?? '';
    const submitButton = form.formElements.find((field) => field.key === submitButtonId) ?? null;
    const isLastStep = this.currentStepIndex() === form.steps.length - 1;
    const currentStepSubmissions = this.currentStepSubmissions();
    const validationResults = this.formSubmissionService.validateStep(form, currentStepSubmissions);

    this.applyValidationAndMaybeFocus(validationResults, currentStepSubmissions);
    if (validationResults.some((result) => !result.result.valid)) {
      return;
    }

    const isFinalized = Boolean((submitButton?.properties as Record<string, unknown> | undefined)?.['finalizeForm']) || isLastStep;
    const progressiveSubmit = Boolean(submitButton) && !isFinalized;
    if ((submitButton || isLastStep) && !this.confirmSubmission()) {
      this.isProgressiveSubmit.set(false);
      return;
    }

    if (!this.baseUrl()) {
      this.setWarningStatus('No base URL configured for form submission.');
      return;
    }

    this.isSubmitting.set(true);
    this.isProgressiveSubmit.set(progressiveSubmit);
    const model = this.formSubmissionService.buildSubmitModel(
      form,
      currentStepSubmissions,
      this.currentStepIndex(),
      this.currentPageUrl() || this.document.location?.href || '/',
      this.identityInfo()?.accessToken,
      isFinalized,
      this.storedSubmissionKey()
    );

    this.formSubmissionService.submit(form, this.baseUrl(), model).subscribe({
      next: (result) => {
        this.storeSubmissionKey(result.submissionKey);
        this.submitSucceeded.set(result.success);
        this.isFormFinalized.set(isFinalized && result.success);
        this.isWarningStatus.set(false);
        this.statusMessage.set(
          progressiveSubmit
            ? result.messages?.map((message) => message.message).join('<br>') || ''
            : form.properties.submitSuccessMessage || result.messages?.map((message) => message.message).join('<br>') || ''
        );
        this.submitted.emit(result);
        this.isSubmitting.set(false);

        if (this.isFormFinalized()) {
          this.formNavigationService.clearNavigationState(form);
          this.clearStoredSubmissionKey();
        }

        if (submitButton) {
          this.redirectIfConfigured(
            String(((submitButton.properties as unknown as Record<string, unknown>)['redirectToPage']) ?? form.properties.redirectToPage ?? '')
          );
        }
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.handleSubmitError(error);
      }
    });
  }

  private patchDraftValues(draftSubmissions: FormSubmission[]): void {
    const formGroup = this.formGroup();
    for (const submission of draftSubmissions) {
      const control = formGroup.get(submission.elementKey);
      if (control) {
        control.patchValue(submission.value, { emitEvent: false });
      }
    }
  }

  private refreshDependencies(): void {
    const form = this.resolvedForm();
    if (!form) {
      return;
    }

    const submissions = this.currentSubmissions();
    const existingDependencies = this.elementDependencies();
    const nextDependencies: Array<{ elementKey: string; isSatisfied: boolean; sastisfiedAction?: string }> = [];
    const inactiveElements: string[] = [];

    for (const field of form.formElements) {
      const satisfiedAction = String(field.properties['satisfiedAction'] ?? '');
      const hasConditions = Array.isArray(field.properties['conditions']) && field.properties['conditions'].length > 0;

      if (!satisfiedAction || !hasConditions) {
        continue;
      }

      const isSatisfied = this.formDependConditionsService.checkConditions(field, submissions, existingDependencies);
      const isVisible = isSatisfied ? satisfiedAction === 'Show' : satisfiedAction === 'Hide';

      nextDependencies.push({
        elementKey: field.key,
        isSatisfied,
        sastisfiedAction: satisfiedAction
      });

      if (!isVisible) {
        inactiveElements.push(field.key);
      }
    }

    this.elementDependencies.set(nextDependencies);
    this.dependencyInactiveElements.set(inactiveElements);
  }

  private currentSubmissions(): FormSubmission[] {
    const form = this.resolvedForm();
    return form ? this.formSubmissionService.toFormSubmissions(form, this.formGroup()) : [];
  }

  private currentStepSubmissions(): FormSubmission[] {
    const form = this.resolvedForm();
    if (!form) {
      return [];
    }

    return this.formSubmissionService.collectCurrentStepSubmissions(
      form,
      this.formGroup(),
      this.currentStepIndex(),
      this.dependencyInactiveElements()
    );
  }

  private applyValidationAndMaybeFocus(validationResults: FormValidationResult[], currentStepSubmissions: FormSubmission[]): void {
    const fieldKeys = currentStepSubmissions.map((submission) => submission.elementKey);
    this.formSubmissionService.clearValidationResults(this.formGroup(), fieldKeys);
    this.formSubmissionService.applyValidationResults(this.formGroup(), validationResults);
    this.hasSubmitted.set(true);

    if (validationResults.some((result) => !result.result.valid)) {
      this.focusFirstInvalidControl(fieldKeys);
    }
  }

  private handleSubmitError(error: unknown): void {
    const form = this.resolvedForm();
    if (!form) {
      return;
    }

    const serverError = error as { status?: number; detail?: string; errors?: Record<string, string[]> };
    if (serverError.status === 401) {
      this.formAuthService.clearAccessToken();
    }

    this.formSubmissionService.applyServerValidation(this.formGroup(), serverError as FormServerValidationError);
    this.setWarningStatus(serverError.detail || 'Form submission failed.');
    this.submissionError.emit(error);
    this.focusFirstInvalidControl();
  }

  private focusFirstInvalidControl(allowedKeys?: string[]): void {
    const invalidKey = this.formSubmissionService.firstInvalidControlKey(this.formGroup(), allowedKeys);
    if (!invalidKey) {
      return;
    }

    const invalidElement = this.document.getElementById(invalidKey) as HTMLElement | null;
    invalidElement?.focus();
  }

  private confirmSubmission(): boolean {
    const form = this.resolvedForm();
    if (!form) {
      return true;
    }

    const confirmationMessage = form.properties.confirmationMessage ?? '';
    if (!confirmationMessage && !form.properties.showSummarizedData) {
      return true;
    }

    const summary = form.properties.showSummarizedData
      ? this.formConfirmationService.buildSummary(form, this.formGroup(), this.currentStepIndex())
      : '';
    const prompt = [confirmationMessage, summary].filter(Boolean).join('\n\n');
    if (!prompt) {
      return true;
    }

    return this.document.defaultView?.confirm(prompt) ?? true;
  }

  private canSubmitAnonymously(form: FormSchema): boolean {
    return form.properties.allowAnonymousSubmission !== false || Boolean(this.identityInfo()?.accessToken);
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

  private redirectIfConfigured(redirectToPage: string): void {
    if (!redirectToPage || !this.document.defaultView) {
      return;
    }

    const target = new URL(redirectToPage, this.document.location?.href || this.document.baseURI);
    this.document.defaultView.location.assign(target.href);
  }

  private readStoredSubmissionKey(): string {
    try {
      return this.document.defaultView?.localStorage.getItem(this.stepStorageKey) ?? '';
    } catch {
      return '';
    }
  }

  private storeSubmissionKey(submissionKey?: string): void {
    const nextValue = submissionKey ?? '';
    this.storedSubmissionKey.set(nextValue);

    try {
      this.document.defaultView?.localStorage.setItem(this.stepStorageKey, nextValue);
    } catch {
      // Ignore storage failures to preserve submit flow.
    }
  }

  private clearStoredSubmissionKey(): void {
    this.storedSubmissionKey.set('');
    try {
      this.document.defaultView?.localStorage.removeItem(this.stepStorageKey);
    } catch {
      // Ignore storage failures to preserve submit flow.
    }
  }

  private asHistory(): { push?: (path: string) => void } | undefined {
    return (this.history() as { push?: (path: string) => void } | undefined) ?? undefined;
  }
}
