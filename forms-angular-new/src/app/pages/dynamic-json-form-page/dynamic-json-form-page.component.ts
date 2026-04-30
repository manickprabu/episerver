import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { FormSubmission } from '../../episerver-forms/episerver-sdk';
import { DynamicEpiServerForm } from '../../episerver-forms/models/dynamic-episerver-form.model';
import { FormField, FormSchema, FormStep, FormSubmissionResult } from '../../episerver-forms/models/form-schema.model';
import { DynamicFormAdapterService } from '../../episerver-forms/services/dynamic-form-adapter.service';
import { FormNavigationService } from '../../episerver-forms/services/form-navigation.service';
import { FormSchemaFormService } from '../../episerver-forms/services/form-schema-form.service';
import { FormSubmissionService } from '../../episerver-forms/services/form-submission.service';
import { DynamicJsonFormPageService } from './dynamic-json-form-page.service';

@Component({
  selector: 'app-dynamic-json-form-page',
  standalone: false,
  templateUrl: './dynamic-json-form-page.component.html',
  styleUrls: ['./dynamic-json-form-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicJsonFormPageComponent {
  protected isLoading = true;
  protected source!: DynamicEpiServerForm;
  protected form!: FormSchema;
  protected formGroup!: FormGroup;
  protected steps: FormStep[] = [];
  protected endpoint = '';
  protected draftModeLabel = '';
  protected progressLabel = 'Page';
  protected nextButtonLabel = 'Next';
  protected previousButtonLabel = 'Previous';

  protected currentStepIndex = 0;
  protected isSubmitting = false;
  protected hasSubmitted = false;
  protected submitSucceeded = false;
  protected isWarningStatus = false;
  protected statusMessage = '';
  protected submissionKey = '';

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly dynamicFormAdapterService: DynamicFormAdapterService,
    private readonly formNavigationService: FormNavigationService,
    private readonly formSchemaFormService: FormSchemaFormService,
    private readonly formSubmissionService: FormSubmissionService,
    private readonly dynamicJsonFormPageService: DynamicJsonFormPageService
  ) {
    this.endpoint = this.dynamicJsonFormPageService.endpoint;
    this.draftModeLabel = 'Save progress to http://localhost:8000/test-episerver-form as a partial submission.';

    this.dynamicJsonFormPageService.loadForm().subscribe({
      next: (source) => this.initializeForm(source),
      error: () => {
        this.isLoading = false;
        this.setWarningStatus('Unable to load form from http://localhost:8000/test-episerver-form.');
      }
    });
  }

  protected get validationCssClass(): string {
    return this.hasSubmitted && this.formGroup.invalid ? 'ValidationFail' : 'ValidationSuccess';
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

  protected nextStep(): void {
    const step = this.steps[this.currentStepIndex];
    if (!step) {
      return;
    }

    const submissions = this.formSubmissionService.collectCurrentStepSubmissions(this.form, this.formGroup, this.currentStepIndex, []);
    const fieldKeys = this.visibleStepFields(step).map((field) => field.key);
    this.formSubmissionService.clearValidationResults(this.formGroup, fieldKeys);
    const results = this.formSubmissionService.validateStep(this.form, submissions);
    this.formSubmissionService.applyValidationResults(this.formGroup, results);
    this.markControlsTouched(step);

    if (results.some((result) => !result.result.valid)) {
      this.hasSubmitted = true;
      this.focusFirstInvalidControl(fieldKeys);
      return;
    }

    if (this.canGoNext) {
      const nextStepIndex = this.formNavigationService.findNextStep(this.form, this.currentStepIndex, []);
      this.openStep(nextStepIndex);
    }
  }

  protected previousStep(): void {
    if (!this.canGoPrevious) {
      return;
    }

    const previousStepIndex = this.formNavigationService.findPreviousStep(this.form, this.currentStepIndex, []);
    this.openStep(previousStepIndex);
  }

  protected openStep(stepIndex: number): void {
    if (!this.isStepAccessible(stepIndex)) {
      return;
    }

    this.currentStepIndex = stepIndex;
    this.persistNavigationState();
  }

  protected isStepOpen(stepIndex: number): boolean {
    return this.currentStepIndex === stepIndex;
  }

  protected isStepAccessible(stepIndex: number): boolean {
    if (stepIndex <= 0) {
      return true;
    }

    for (let index = 0; index < stepIndex; index += 1) {
      if (!this.isStepComplete(index)) {
        return false;
      }
    }

    return true;
  }

  protected isStepComplete(stepIndex: number): boolean {
    const step = this.steps[stepIndex];
    if (!step) {
      return false;
    }

    const controls = this.controlsForStep(step);
    return controls.length === 0 || controls.every((control) => control.valid);
  }

  protected stepHeading(step: FormStep, stepIndex: number): string {
    const stepProperties = (step.formStep.properties ?? {}) as Record<string, unknown>;
    const label = stepProperties['label'];
    if (label && !step.formStep.key.endsWith('-step-0')) {
      return String(label);
    }

    return 'Step ' + (stepIndex + 1);
  }

  protected visibleStepFields(step: FormStep): FormField[] {
    return step.elements.filter((field) => field.contentType !== 'FormStepBlock') as FormField[];
  }

  protected savePartial(): void {
    this.persistNavigationState();
    this.submit(false);
  }

  protected submitFinal(): void {
    this.hasSubmitted = true;

    const fieldKeys = this.form.formElements.filter((field) => field.contentType !== 'FormStepBlock').map((field) => field.key);
    const submissions = this.formSubmissionService.toFormSubmissions(this.form, this.formGroup);
    this.formSubmissionService.clearValidationResults(this.formGroup, fieldKeys);
    const results = this.formSubmissionService.validateStep(this.form, submissions);
    this.formSubmissionService.applyValidationResults(this.formGroup, results);
    this.markAllControlsTouched();

    if (results.some((result) => !result.result.valid)) {
      this.focusFirstInvalidControl(fieldKeys);
      return;
    }

    this.submit(true);
  }

  protected handleReset(): void {
    this.formGroup.reset(this.formSchemaFormService.buildForm(this.form).initialValue);
    this.currentStepIndex = 0;
    this.hasSubmitted = false;
    this.submitSucceeded = false;
    this.isWarningStatus = false;
    this.statusMessage = '';
    this.submissionKey = this.dynamicFormAdapterService.initialSubmissionKey(this.source);
    this.formNavigationService.clearNavigationState(this.form);
  }

  protected trackStep(_index: number, step: FormStep): string {
    return step.formStep.key;
  }

  private submit(isFinalized: boolean): void {
    this.isSubmitting = true;
    const submissions = this.formSubmissionService.toFormSubmissions(this.form, this.formGroup);
    const model = this.formSubmissionService.buildSubmitModel(
      this.form,
      submissions,
      this.currentStepIndex,
      this.currentPageUrl(),
      undefined,
      isFinalized,
      this.submissionKey
    );

    const request = isFinalized
      ? this.dynamicJsonFormPageService.submitFinal(this.source, model)
      : this.dynamicJsonFormPageService.savePartial(this.source, model);

    request
      .subscribe({
        next: (result) => {
          this.submissionKey = result.submissionKey ?? this.submissionKey;
          this.submitSucceeded = !!(result.success && isFinalized);
          this.isWarningStatus = false;
          this.statusMessage =
            result.messages?.map((message) => message.message).join('<br>') ||
            (isFinalized ? this.form.properties.submitSuccessMessage || 'Thanks, your form has been submitted.' : 'Draft saved.');
          this.isSubmitting = false;

          if (isFinalized && result.success) {
            this.formNavigationService.clearNavigationState(this.form);
          } else {
            this.persistNavigationState();
          }
        },
        error: (error: unknown) => {
          const problem = error as { detail?: string; errors?: Record<string, string[]> };
          this.formSubmissionService.applyServerValidation(this.formGroup, problem as never);
          this.setWarningStatus(problem?.detail || 'Form submission failed.');
          this.isSubmitting = false;
          this.focusFirstInvalidControl();
        }
      });
  }

  private persistNavigationState(): void {
    this.formNavigationService.goToStep(
      this.form,
      this.currentStepIndex,
      this.formSubmissionService.toFormSubmissions(this.form, this.formGroup)
    );
  }

  private currentPageUrl(): string {
    return this.document.location?.href || this.document.baseURI || '';
  }

  private initializeForm(source: DynamicEpiServerForm): void {
    this.source = source;
    this.form = this.dynamicFormAdapterService.adaptForm(source);
    const builtForm = this.formSchemaFormService.buildForm(this.form);
    this.formGroup = builtForm.formGroup;
    this.steps = builtForm.steps;
    this.submissionKey = this.dynamicFormAdapterService.initialSubmissionKey(source);
    this.progressLabel = this.form.localizations?.['pageButtonLabel'] || 'Page';
    this.nextButtonLabel = this.form.localizations?.['nextButtonLabel'] || 'Next';
    this.previousButtonLabel = this.form.localizations?.['previousButtonLabel'] || 'Previous';

    this.patchDraftValues(this.formNavigationService.loadDraft(this.form));
    this.currentStepIndex = this.formNavigationService.resolveInitialStepIndex(this.form, this.currentPageUrl());
    this.isLoading = false;
  }

  private focusFirstInvalidControl(allowedKeys?: string[]): void {
    const invalidKey = this.formSubmissionService.firstInvalidControlKey(this.formGroup, allowedKeys);
    if (!invalidKey) {
      return;
    }

    const invalidElement = this.document.getElementById(invalidKey) as HTMLElement | null;
    invalidElement?.focus();
  }

  private controlsForStep(step: FormStep) {
    return this.visibleStepFields(step)
      .map((field) => this.formGroup.get(field.key))
      .filter((control): control is NonNullable<typeof control> => !!control);
  }

  private markControlsTouched(step: FormStep): void {
    this.controlsForStep(step).forEach((control) => control.markAsTouched());
  }

  private markAllControlsTouched(): void {
    Object.values(this.formGroup.controls).forEach((control) => control.markAsTouched());
  }

  private patchDraftValues(submissions: FormSubmission[]): void {
    if (!submissions.length) {
      return;
    }

    const patch: Record<string, unknown> = {};

    submissions.forEach((submission) => {
      const field = this.form.formElements.find((item) => item.key === submission.elementKey);
      if (!field) {
        return;
      }

      patch[submission.elementKey] = this.normalizeDraftValue(field as FormField, submission.value);
    });

    this.formGroup.patchValue(patch);
  }

  private normalizeDraftValue(field: FormField, value: unknown): unknown {
    if (typeof value === 'string' && field.properties.allowMultiSelect) {
      return value ? value.split(',').filter(Boolean) : [];
    }

    return value;
  }

  private setWarningStatus(message: string): void {
    this.submitSucceeded = false;
    this.isWarningStatus = true;
    this.statusMessage = message;
  }
}
