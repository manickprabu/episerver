import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

import { FormConstants, FormDependConditionsService, FormStateInitService, FormSubmission, FormValidationResult, StepHelperService, htmlDecodeEntities } from '../../../episerver-sdk';
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
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormContainerComponent implements OnChanges, OnDestroy {
  @Input() form!: FormSchema;
  @Input() baseUrl = '';
  @Input() currentPageUrl = '';
  @Input() identityInfo: IdentityInfo | undefined = undefined;
  @Input() history: unknown = undefined;
  @Input() hideFormOnSuccess = true;

  @Output() readonly submitted = new EventEmitter<FormSubmissionResult>();
  @Output() readonly submissionError = new EventEmitter<unknown>();

  protected currentStepIndex = 0;
  protected isSubmitting = false;
  protected hasSubmitted = false;
  protected statusMessage = '';
  protected submitSucceeded = false;
  protected isWarningStatus = false;
  protected isFormFinalized = false;
  protected isProgressiveSubmit = false;
  protected storedSubmissionKey = '';
  protected formGroup = new FormGroup({});
  protected steps: FormSchema['steps'] = [];
  protected resolvedForm: FormSchema | null = null;
  protected dependencyInactiveElements: string[] = [];
  protected elementDependencies: Array<{ elementKey: string; isSatisfied: boolean; sastisfiedAction?: string }> = [];

  private initialValue: Record<string, unknown> = {};
  private stepStorageKey = '';
  private formGroupSubscription?: Subscription;
  private readonly dependencyDisabledControlKeys = new Set<string>();

  protected get currentStep() {
    return this.steps[this.currentStepIndex] ?? null;
  }

  protected get hasMultipleSteps(): boolean {
    return this.steps.length > 1;
  }

  protected get canGoPrevious(): boolean {
    return this.currentStepIndex > 0;
  }

  protected get canGoNext(): boolean {
    return this.currentStepIndex < this.steps.length - 1;
  }

  protected get nextButtonLabel(): string {
    return this.resolvedForm?.localizations?.['nextButtonLabel'] || this.currentStep?.formStep.localizations?.['nextButtonLabel'] || 'Next';
  }

  protected get previousButtonLabel(): string {
    return this.resolvedForm?.localizations?.['previousButtonLabel'] || this.currentStep?.formStep.localizations?.['previousButtonLabel'] || 'Previous';
  }

  protected get progressLabel(): string {
    return this.resolvedForm?.localizations?.['pageButtonLabel'] || this.currentStep?.formStep.localizations?.['pageButtonLabel'] || 'Page';
  }

  protected get isMalFormSteps(): boolean {
    return this.resolvedForm ? this.formNavigationService.isMalFormSteps(this.resolvedForm) : false;
  }

  protected get isStepValidToDisplay(): boolean {
    const form = this.resolvedForm;
    if (!form) {
      return false;
    }

    return this.formNavigationService.isStepValidToDisplay(form, this.currentStepIndex, this.currentPageUrl || this.document.location?.href || '/', this.dependencyInactiveElements);
  }

  protected get showFormBody(): boolean {
    return !((this.hideFormOnSuccess && this.submitSucceeded) || (this.isProgressiveSubmit && this.submitSucceeded));
  }

  protected get validationCssClass(): string {
    return this.hasSubmitted && this.formGroup.invalid ? 'validationFail' : 'validationSuccess';
  }

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly formAuthService: FormAuthService,
    private readonly formConfirmationService: FormConfirmationService,
    private readonly formDependConditionsService: FormDependConditionsService,
    private readonly formNavigationService: FormNavigationService,
    private readonly formSchemaFormService: FormSchemaFormService,
    private readonly formStateInitService: FormStateInitService,
    private readonly formSubmissionService: FormSubmissionService,
    private readonly stepHelperService: StepHelperService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['form'] && this.form) {
      this.initializeForm();
    }

    if (this.resolvedForm) {
      this.syncStepDisplayState();
      this.focusCurrentStepField();
      this.changeDetectorRef.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.formGroupSubscription?.unsubscribe();
  }

  protected previousStep(): void {
    const form = this.resolvedForm;
    if (!form || !this.canGoPrevious) {
      return;
    }

    const previousStepIndex = this.formNavigationService.findPreviousStep(form, this.currentStepIndex, this.dependencyInactiveElements);

    this.currentStepIndex = previousStepIndex;
    this.formNavigationService.goToStep(form, previousStepIndex, this.currentSubmissions(), this.asHistory());
    this.focusCurrentStepField();
  }

  protected nextStep(): void {
    const form = this.resolvedForm;
    if (!form || !this.canGoNext) {
      return;
    }

    if (!this.canSubmitAnonymously(form)) {
      this.setWarningStatus(form.localizations?.['allowAnonymousSubmissionErrorMessage'] || 'Authentication is required.');
      return;
    }

    const currentStepSubmissions = this.currentStepSubmissions();
    const validationResults = this.formSubmissionService.validateStep(form, currentStepSubmissions);
    this.applyValidationAndMaybeFocus(validationResults, currentStepSubmissions);

    if (validationResults.some(result => !result.result.valid)) {
      return;
    }

    const nextStepIndex = this.formNavigationService.findNextStep(form, this.currentStepIndex, this.dependencyInactiveElements);

    if (!this.baseUrl) {
      this.formNavigationService.goToStep(form, nextStepIndex, this.currentSubmissions(), this.asHistory());
      this.currentStepIndex = nextStepIndex;
      this.focusCurrentStepField();
      return;
    }

    this.isSubmitting = true;
    const model = this.formSubmissionService.buildSubmitModel(form, currentStepSubmissions, this.currentStepIndex, this.currentPageUrl || this.document.location?.href || '/', this.identityInfo?.accessToken, false, this.storedSubmissionKey);

    this.formSubmissionService.submit(form, this.baseUrl, model).subscribe({
      next: result => {
        this.storeSubmissionKey(result.submissionKey);
        this.currentStepIndex = nextStepIndex;
        this.formNavigationService.goToStep(form, nextStepIndex, this.currentSubmissions(), this.asHistory());
        this.submitSucceeded = true;
        this.isWarningStatus = false;
        this.statusMessage = '';
        this.isSubmitting = false;
        this.focusCurrentStepField();
        this.changeDetectorRef.markForCheck();
      },
      error: error => {
        this.isSubmitting = false;
        this.handleSubmitError(error);
      }
    });
  }

  protected handleReset(): void {
    const form = this.resolvedForm;
    if (!form) {
      return;
    }

    const confirmationMessage = form.properties.resetConfirmationMessage ?? '';
    if (confirmationMessage && !(this.document.defaultView?.confirm(htmlDecodeEntities(confirmationMessage)) ?? true)) {
      return;
    }

    this.formGroup.reset(this.initialValue);
    this.currentStepIndex = 0;
    this.hasSubmitted = false;
    this.submitSucceeded = false;
    this.isProgressiveSubmit = false;
    this.clearStatusMessage();
    this.isFormFinalized = false;
    this.storedSubmissionKey = '';
    this.clearStoredSubmissionKey();
    this.formNavigationService.clearNavigationState(form);
    this.refreshDependencies();

    if (form.steps.length > 0) {
      this.formNavigationService.goToStep(form, 0, this.currentSubmissions(), this.asHistory());
    }

    this.focusCurrentStepField();
    this.changeDetectorRef.markForCheck();
  }

  protected submitForm(event?: SubmitEvent): void {
    const form = this.resolvedForm;
    if (!form) {
      return;
    }

    this.hasSubmitted = true;

    if (!this.canSubmitAnonymously(form)) {
      this.setWarningStatus(form.localizations?.['allowAnonymousSubmissionErrorMessage'] || 'Authentication is required.');
      return;
    }

    const submitButtonId = (event?.submitter as HTMLButtonElement | null)?.id ?? '';
    const submitButton = form.formElements.find(field => field.key === submitButtonId) ?? null;
    const isLastStep = this.currentStepIndex === form.steps.length - 1;
    const currentStepSubmissions = this.currentStepSubmissions();
    const validationResults = this.formSubmissionService.validateStep(form, currentStepSubmissions);

    this.applyValidationAndMaybeFocus(validationResults, currentStepSubmissions);
    if (validationResults.some(result => !result.result.valid)) {
      return;
    }

    const isFinalized = Boolean((submitButton?.properties as Record<string, unknown> | undefined)?.['finalizeForm']) || isLastStep;
    const progressiveSubmit = Boolean(submitButton) && !isFinalized;
    if ((submitButton || isLastStep) && !this.confirmSubmission()) {
      this.isProgressiveSubmit = false;
      return;
    }

    if (!this.baseUrl) {
      this.setWarningStatus('No base URL configured for form submission.');
      return;
    }

    this.isSubmitting = true;
    this.isProgressiveSubmit = progressiveSubmit;
    const model = this.formSubmissionService.buildSubmitModel(form, currentStepSubmissions, this.currentStepIndex, this.currentPageUrl || this.document.location?.href || '/', this.identityInfo?.accessToken, isFinalized, this.storedSubmissionKey);

    this.formSubmissionService.submit(form, this.baseUrl, model).subscribe({
      next: result => {
        this.storeSubmissionKey(result.submissionKey);
        this.submitSucceeded = result.success;
        this.isFormFinalized = isFinalized && result.success;
        this.isWarningStatus = false;
        this.statusMessage = progressiveSubmit ? result.messages?.map(message => message.message).join('<br>') || '' : form.properties.submitSuccessMessage || result.messages?.map(message => message.message).join('<br>') || '';
        this.submitted.emit(result);
        this.isSubmitting = false;

        if (this.isFormFinalized) {
          this.formGroup.disable({ emitEvent: false });
          this.formNavigationService.clearNavigationState(form);
          this.clearStoredSubmissionKey();
        }

        if (submitButton) {
          this.redirectIfConfigured(String((submitButton.properties as unknown as Record<string, unknown>)['redirectToPage'] ?? form.properties.redirectToPage ?? ''));
        }

        this.changeDetectorRef.markForCheck();
      },
      error: error => {
        this.isSubmitting = false;
        this.handleSubmitError(error);
      }
    });
  }

  private patchDraftValues(draftSubmissions: FormSubmission[]): void {
    const formGroup = this.formGroup;
    for (const submission of draftSubmissions) {
      const control = formGroup.get(submission.elementKey);
      if (control) {
        control.patchValue(submission.value, { emitEvent: false });
      }
    }
  }

  private refreshDependencies(): void {
    const form = this.resolvedForm;
    if (!form) {
      return;
    }

    const submissions = this.currentSubmissions();
    const existingDependencies = this.elementDependencies;
    const nextDependencies: Array<{ elementKey: string; isSatisfied: boolean; sastisfiedAction?: string }> = [];
    const inactiveElements: string[] = [];

    for (const field of form.formElements) {
      const normalizedField = this.normalizeDependencyField(form, field);
      const satisfiedAction = String(normalizedField.properties['satisfiedAction'] ?? '').toLowerCase();
      const hasConditions = Array.isArray(normalizedField.properties['conditions']) && normalizedField.properties['conditions'].length > 0;
      const hasUnresolvedConditions = Boolean(normalizedField.properties['hasUnresolvedConditions']);

      if (!satisfiedAction || (!hasConditions && !hasUnresolvedConditions)) {
        continue;
      }

      const isSatisfied = hasUnresolvedConditions ? false : this.formDependConditionsService.checkConditions(normalizedField, submissions, existingDependencies);
      const isVisible = isSatisfied ? satisfiedAction === 'show' : satisfiedAction === 'hide';

      nextDependencies.push({
        elementKey: field.key,
        isSatisfied,
        sastisfiedAction: satisfiedAction
      });

      if (!isVisible) {
        inactiveElements.push(field.key);
      }
    }

    this.elementDependencies = nextDependencies;
    this.dependencyInactiveElements = inactiveElements;
    this.syncDependencyControlState(inactiveElements);
  }

  private currentSubmissions(): FormSubmission[] {
    const form = this.resolvedForm;
    return form ? this.formSubmissionService.toFormSubmissions(form, this.formGroup) : [];
  }

  private currentStepSubmissions(): FormSubmission[] {
    const form = this.resolvedForm;
    if (!form) {
      return [];
    }

    return this.formSubmissionService.collectCurrentStepSubmissions(form, this.formGroup, this.currentStepIndex, this.dependencyInactiveElements);
  }

  private applyValidationAndMaybeFocus(validationResults: FormValidationResult[], currentStepSubmissions: FormSubmission[]): void {
    const fieldKeys = currentStepSubmissions.map(submission => submission.elementKey);
    this.formSubmissionService.clearValidationResults(this.formGroup, fieldKeys);
    this.formSubmissionService.applyValidationResults(this.formGroup, validationResults);
    this.hasSubmitted = true;

    if (validationResults.some(result => !result.result.valid)) {
      this.focusFirstInvalidControl(fieldKeys);
    }
  }

  private handleSubmitError(error: unknown): void {
    const form = this.resolvedForm;
    if (!form) {
      return;
    }

    const serverError = error as { status?: number; detail?: string; errors?: Record<string, string[]> };
    if (serverError.status === 401) {
      this.formAuthService.clearAccessToken();
    }

    this.formSubmissionService.applyServerValidation(this.formGroup, serverError as FormServerValidationError);
    this.setWarningStatus(serverError.detail || 'Form submission failed.');
    this.submissionError.emit(error);
    this.focusFirstInvalidControl();
    this.changeDetectorRef.markForCheck();
  }

  private focusFirstInvalidControl(allowedKeys?: string[]): void {
    const invalidKey = this.formSubmissionService.firstInvalidControlKey(this.formGroup, allowedKeys);
    if (!invalidKey) {
      return;
    }

    const invalidElement = this.document.getElementById(invalidKey) as HTMLElement | null;
    invalidElement?.focus();
  }

  private confirmSubmission(): boolean {
    const form = this.resolvedForm;
    if (!form) {
      return true;
    }

    const confirmationMessage = form.properties.confirmationMessage ?? '';
    if (!confirmationMessage && !form.properties.showSummarizedData) {
      return true;
    }

    const summary = form.properties.showSummarizedData ? this.formConfirmationService.buildSummary(form, this.formGroup, this.currentStepIndex) : '';
    const prompt = [confirmationMessage, summary].filter(Boolean).join('\n\n');
    if (!prompt) {
      return true;
    }

    return this.document.defaultView?.confirm(prompt) ?? true;
  }

  private canSubmitAnonymously(form: FormSchema): boolean {
    return form.properties.allowAnonymousSubmission !== false || Boolean(this.identityInfo?.accessToken);
  }

  private clearStatusMessage(): void {
    this.statusMessage = '';
    this.isWarningStatus = false;
  }

  private setWarningStatus(message: string): void {
    this.submitSucceeded = false;
    this.isWarningStatus = true;
    this.statusMessage = message;
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
    this.storedSubmissionKey = nextValue;

    try {
      this.document.defaultView?.localStorage.setItem(this.stepStorageKey, nextValue);
    } catch {
      // Ignore storage failures to preserve submit flow.
    }
  }

  private clearStoredSubmissionKey(): void {
    this.storedSubmissionKey = '';
    try {
      this.document.defaultView?.localStorage.removeItem(this.stepStorageKey);
    } catch {
      // Ignore storage failures to preserve submit flow.
    }
  }

  private asHistory(): { push?: (path: string) => void } | undefined {
    return (this.history as { push?: (path: string) => void } | undefined) ?? undefined;
  }

  private initializeForm(): void {
    this.formGroupSubscription?.unsubscribe();
    this.dependencyDisabledControlKeys.clear();

    const builtForm = this.formSchemaFormService.buildForm(this.form);
    this.resolvedForm = builtForm.form;
    this.formGroup = builtForm.formGroup;
    this.steps = builtForm.steps;
    this.initialValue = builtForm.initialValue;
    this.stepStorageKey = FormConstants.FormSubmissionId + builtForm.form.key;

    const state = this.formStateInitService.initFormState(builtForm.form, this.currentPageUrl || this.document.location?.href || '/', this.history);

    this.elementDependencies = state.elementDependencies;
    this.currentStepIndex = state.currentStepIndex;
    this.patchDraftValues(state.formSubmissions);
    this.storedSubmissionKey = this.readStoredSubmissionKey();
    this.hasSubmitted = false;
    this.submitSucceeded = false;
    this.isProgressiveSubmit = false;
    this.isWarningStatus = false;
    this.statusMessage = '';
    this.isFormFinalized = false;
    this.refreshDependencies();

    this.formGroupSubscription = builtForm.formGroup.valueChanges.subscribe(() => {
      this.refreshDependencies();
      this.syncStepDisplayState();
      this.changeDetectorRef.markForCheck();
    });
  }

  private syncStepDisplayState(): void {
    const form = this.resolvedForm;
    if (!form) {
      return;
    }

    if (!this.isStepValidToDisplay) {
      this.currentStepIndex = this.formNavigationService.resolveInitialStepIndex(form, this.currentPageUrl || this.document.location?.href || '/');
    }

    if (this.isMalFormSteps) {
      this.setWarningStatus(form.localizations?.['malformStepconfigruationErrorMessage'] || 'Form step configuration is invalid.');
    } else if (this.identityInfo?.accessToken || form.properties.allowAnonymousSubmission !== false) {
      if (!this.submitSucceeded) {
        this.clearStatusMessage();
      }
    } else {
      this.setWarningStatus(form.localizations?.['allowAnonymousSubmissionErrorMessage'] || 'Authentication is required.');
    }
  }

  private focusCurrentStepField(): void {
    const form = this.resolvedForm;
    if (!form || this.isMalFormSteps || !this.isStepValidToDisplay) {
      return;
    }

    if (!(form.properties.focusOnForm || this.currentStepIndex > 0)) {
      return;
    }

    const firstInputKey = this.stepHelperService.getFirstInputElement(form, this.currentStepIndex, this.dependencyInactiveElements);
    if (!firstInputKey) {
      return;
    }

    queueMicrotask(() => {
      const target = this.document.getElementById(firstInputKey) as HTMLElement | null;
      target?.focus();
    });
  }

  private syncDependencyControlState(inactiveElements: string[]): void {
    const hiddenKeys = new Set(inactiveElements);

    for (const field of this.resolvedForm?.formElements ?? []) {
      if (field.contentType === 'FormStepBlock') {
        continue;
      }

      const control = this.formGroup.get(field.key);
      if (!control) {
        continue;
      }

      if (hiddenKeys.has(field.key)) {
        if (!control.disabled) {
          control.disable({ emitEvent: false });
          this.dependencyDisabledControlKeys.add(field.key);
        }
        continue;
      }

      if (this.dependencyDisabledControlKeys.has(field.key)) {
        control.enable({ emitEvent: false });
        this.dependencyDisabledControlKeys.delete(field.key);
      }
    }
  }

  private normalizeDependencyField(form: FormSchema, field: FormSchema['formElements'][number]): FormSchema['formElements'][number] {
    const sourceFieldKeyById = new Map<number, string>();

    for (const formElement of form.formElements) {
      const rawId = (formElement.properties['contentLinkId'] ?? formElement.properties['contentLink'] ?? null) as number | { id?: number } | null;
      const resolvedId = typeof rawId === 'number' ? rawId : rawId && typeof rawId.id === 'number' ? rawId.id : undefined;

      if (typeof resolvedId === 'number') {
        sourceFieldKeyById.set(resolvedId, formElement.key);
      }
    }

    const rawConditions = (field.properties['conditions'] ?? field.properties['Conditions'] ?? []) as Array<{ field?: string | number | { id?: number; key?: string | null } | null; operator?: string | number | null; fieldValue?: unknown }>;
    const normalizedConditions = rawConditions
      .map(condition => {
        const sourceField = condition.field;
        const sourceFieldKey =
          typeof sourceField === 'string' ? sourceField : typeof sourceField === 'number' ? sourceFieldKeyById.get(sourceField) : (sourceField?.key ?? (typeof sourceField?.id === 'number' ? sourceFieldKeyById.get(sourceField.id) : undefined));

        if (!sourceFieldKey) {
          return null;
        }

        return {
          field: sourceFieldKey,
          operator: this.normalizeConditionOperator(condition.operator),
          fieldValue: String(condition.fieldValue ?? '')
        };
      })
      .filter((condition): condition is { field: string; operator: string; fieldValue: string } => condition !== null);

    const normalizedProperties = {
      ...field.properties,
      conditions: normalizedConditions,
      hasUnresolvedConditions: rawConditions.length > 0 && normalizedConditions.length === 0,
      conditionCombination: this.normalizeConditionCombination(field.properties['conditionCombination'] ?? field.properties['ConditionCombination']),
      satisfiedAction: this.normalizeSatisfiedAction(field.properties['satisfiedAction'] ?? field.properties['SatisfiedAction'])
    };

    return {
      ...field,
      properties: normalizedProperties
    };
  }

  private normalizeConditionOperator(operator: unknown): string {
    switch (String(operator ?? 'Equals')) {
      case '0':
      case 'Contains':
        return 'Contains';
      case '1':
      case 'NotContains':
        return 'NotContains';
      case '2':
      case 'Equals':
        return 'Equals';
      case '3':
      case 'NotEquals':
        return 'NotEquals';
      case '4':
      case 'MatchRegularExpression':
        return 'MatchRegularExpression';
      default:
        return 'Equals';
    }
  }

  private normalizeConditionCombination(conditionCombination: unknown): string {
    switch (String(conditionCombination ?? 'All').toLowerCase()) {
      case '0':
      case 'any':
      case 'or':
        return 'Any';
      default:
        return 'All';
    }
  }

  private normalizeSatisfiedAction(satisfiedAction: unknown): string {
    return String(satisfiedAction ?? 'show').toLowerCase() === 'hide' ? 'hide' : 'show';
  }
}
