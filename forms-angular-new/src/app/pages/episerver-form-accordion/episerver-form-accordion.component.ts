import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, Inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription, timer } from 'rxjs';

import { EpiserverFieldDefinitionLike, FieldVisibilityState, FormDependConditionsService, FormSubmission } from '../../episerver-forms/episerver-sdk';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormField, FormSchema, FormStep, FormSubmissionResult } from '../../episerver-forms/models/form-schema.model';
import { EpiserverFieldDefinition, EpiserverFormDefinition } from '../../episerver-forms/models/episerver-form-definition.model';
import { EpiserverFormAccordionVisibilityService } from './episerver-form-accordion-visibility.service';
import { EpiserverFormAdapterService } from '../../episerver-forms/services/episerver-form-adapter.service';
import { FormNavigationService } from '../../episerver-forms/services/form-navigation.service';
import { FormSchemaFormService } from '../../episerver-forms/services/form-schema-form.service';
import { FormSubmissionService } from '../../episerver-forms/services/form-submission.service';
import { EpiserverFormAccordionService } from './episerver-form-accordion.service';

@Component({
  selector: 'app-episerver-form-accordion',
  standalone: false,
  templateUrl: './episerver-form-accordion.component.html',
  styleUrls: ['./episerver-form-accordion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EpiserverFormAccordionComponent {
  private static readonly AUTO_SAVE_DELAY_MS = 30000;

  protected isLoading = true;
  protected source!: EpiserverFormDefinition;
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
  protected visibilityState: FieldVisibilityState = { visibilityByGuid: {}, visibilityByContentLinkId: {}, evaluations: [] };
  private autoSaveSubscription?: Subscription;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly destroyRef: DestroyRef,
    private readonly episerverFormAdapterService: EpiserverFormAdapterService,
    private readonly formNavigationService: FormNavigationService,
    private readonly formSchemaFormService: FormSchemaFormService,
    private readonly formSubmissionService: FormSubmissionService,
    private readonly episerverFormAccordionService: EpiserverFormAccordionService,
    private readonly accordionVisibilityService: EpiserverFormAccordionVisibilityService,
    private readonly formDependConditionsService: FormDependConditionsService
  ) {
    this.endpoint = this.episerverFormAccordionService.endpoint;
    this.draftModeLabel = 'Save progress to http://localhost:8000/test-episerver-form as a partial submission.';

    this.episerverFormAccordionService.loadForm().subscribe({
      next: source => this.initializeForm(source),
      error: () => {
        this.isLoading = false;
        this.setWarningStatus('Unable to load form from http://localhost:8000/test-episerver-form.');
      }
    });
  }

  protected get validationCssClass(): string {
    return this.hasSubmitted && this.formGroup.invalid ? 'ValidationFail' : 'ValidationSuccess';
  }

  protected get apiBaseURLPrefix(): string {
    return this.episerverFormAccordionService.apiBaseURLPrefix;
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
    const fieldKeys = this.visibleStepFields(step).map(field => field.key);
    this.formSubmissionService.clearValidationResults(this.formGroup, fieldKeys);
    const results = this.formSubmissionService.validateStep(this.form, submissions);
    this.formSubmissionService.applyValidationResults(this.formGroup, results);
    this.markControlsTouched(step);

    if (results.some(result => !result.result.valid)) {
      this.hasSubmitted = true;
      this.focusFirstInvalidControl(fieldKeys);
      return;
    }

    if (this.canGoNext) {
      const nextStepIndex = this.resolveNextStepIndex();
      this.openStep(nextStepIndex);
    }
  }

  protected previousStep(): void {
    if (!this.canGoPrevious) {
      return;
    }

    const previousStepIndex = this.resolvePreviousStepIndex();
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
    return this.accordionVisibilityService.isStepOpen(this.currentStepIndex, stepIndex);
  }

  protected isStepAccessible(stepIndex: number): boolean {
    return this.accordionVisibilityService.isStepAccessible(stepIndex);
  }

  protected isStepComplete(stepIndex: number): boolean {
    const step = this.steps[stepIndex];
    if (!step) {
      return false;
    }

    const controls = this.controlsForStep(step);
    return controls.length === 0 || controls.every(control => control.valid);
  }

  protected accordionBorderColor(stepIndex: number): string {
    if (this.isStepComplete(stepIndex)) {
      return 'rgba(22, 163, 74, 0.35)';
    }

    if (this.isStepOpen(stepIndex)) {
      return 'rgba(59, 130, 246, 0.45)';
    }

    return 'rgba(15, 23, 42, 0.14)';
  }

  protected accordionIcon(stepIndex: number): string {
    return this.isStepComplete(stepIndex) ? '✓' : '•';
  }

  protected accordionPillColor(stepIndex: number): string {
    if (this.isStepComplete(stepIndex)) {
      return '#16a34a';
    }

    return '#475569';
  }

  protected accordionPillText(stepIndex: number): string {
    if (this.isStepComplete(stepIndex)) {
      return 'Complete';
    }

    return this.isStepOpen(stepIndex) ? 'In progress' : 'Available';
  }

  protected stepHeading(step: FormStep, stepIndex: number): string {
    const stepFieldKeys = new Set(step.elements.map(field => field.key));
    const rawTitleField = this.source.fields.find(
      field => stepFieldKeys.has(field.contentGuid) && field.name === 'Title' && field.type === 'PredefinedHiddenElementBlockProxy' && typeof field.properties.PredefinedValue === 'string' && field.properties.PredefinedValue.trim().length > 0
    );

    if (rawTitleField?.properties.PredefinedValue) {
      return rawTitleField.properties.PredefinedValue;
    }

    const stepProperties = (step.formStep.properties ?? {}) as Record<string, unknown>;
    const label = stepProperties['label'];
    if (label && !step.formStep.key.endsWith('-step-0')) {
      return String(label);
    }

    return 'Step ' + (stepIndex + 1);
  }

  protected visibleStepFields(step: FormStep): FormField[] {
    return step.elements.filter(field => field.contentType !== 'FormStepBlock' && this.isFieldVisible(field.key)) as FormField[];
  }

  protected dependencyEvaluations(): FieldVisibilityState['evaluations'] {
    return this.visibilityState.evaluations;
  }

  protected savePartial(): void {
    this.cancelAutoSave();
    const stepIndexAtSubmit = this.currentStepIndex;
    const nextStepIndex = this.canGoNext ? Math.min(this.currentStepIndex + 1, this.steps.length - 1) : null;

    if (nextStepIndex !== null && nextStepIndex !== this.currentStepIndex) {
      this.currentStepIndex = nextStepIndex;
    }

    this.persistNavigationState();
    this.submit(false, stepIndexAtSubmit);
  }

  protected submitFinal(): void {
    this.cancelAutoSave();
    this.hasSubmitted = true;

    const fieldKeys = this.visibleFormFields().map(field => field.key);
    const submissions = this.visibleFormSubmissions();
    this.formSubmissionService.clearValidationResults(this.formGroup, fieldKeys);
    const results = this.formSubmissionService.validateStep(this.form, submissions);
    this.formSubmissionService.applyValidationResults(this.formGroup, results);
    this.markAllControlsTouched();

    if (results.some(result => !result.result.valid)) {
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
    this.submissionKey = this.episerverFormAdapterService.initialSubmissionKey(this.source as never);
    this.formNavigationService.clearNavigationState(this.form);
  }

  protected trackStep(_index: number, step: FormStep): string {
    return step.formStep.key;
  }

  private isFieldVisible(fieldGuid: string): boolean {
    return this.formDependConditionsService.isFieldVisible(fieldGuid, this.visibilityState);
  }

  private visibleFormFields(): FormField[] {
    return this.form.formElements.filter(field => field.contentType !== 'FormStepBlock' && this.isFieldVisible(field.key)) as FormField[];
  }

  private visibleFormSubmissions(): FormSubmission[] {
    const visibleKeys = new Set(this.visibleFormFields().map(field => field.key));

    return this.formSubmissionService.toFormSubmissions(this.form, this.formGroup).filter(submission => visibleKeys.has(submission.elementKey) || submission.elementKey.startsWith('__'));
  }

  private submit(isFinalized: boolean, submitStepIndex = this.currentStepIndex): void {
    this.isSubmitting = true;
    const submissions = this.visibleFormSubmissions();
    const model = this.formSubmissionService.buildSubmitModel(this.form, submissions, submitStepIndex, this.currentPageUrl(), undefined, isFinalized, this.submissionKey);

    const request = isFinalized ? this.episerverFormAccordionService.submitFinal(this.source, model) : this.episerverFormAccordionService.savePartial(this.source, model);

    request.subscribe({
      next: result => {
        this.submissionKey = result.submissionKey ?? this.submissionKey;
        this.submitSucceeded = !!(result.success && isFinalized);
        this.isWarningStatus = false;
        this.statusMessage = result.messages?.map(message => message.message).join('<br>') || (isFinalized ? this.form.properties.submitSuccessMessage || 'Thanks, your form has been submitted.' : 'Draft saved.');
        this.isSubmitting = false;

        if (isFinalized && result.success) {
          this.formGroup.disable({ emitEvent: false });
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

  private resolveNextStepIndex(): number {
    const sdkNextStepIndex = this.formNavigationService.findNextStep(this.form, this.currentStepIndex, []);
    if (sdkNextStepIndex > this.currentStepIndex) {
      return sdkNextStepIndex;
    }

    return Math.min(this.currentStepIndex + 1, this.steps.length - 1);
  }

  private resolvePreviousStepIndex(): number {
    const sdkPreviousStepIndex = this.formNavigationService.findPreviousStep(this.form, this.currentStepIndex, []);
    if (sdkPreviousStepIndex < this.currentStepIndex) {
      return sdkPreviousStepIndex;
    }

    return Math.max(this.currentStepIndex - 1, 0);
  }

  private persistNavigationState(): void {
    this.formNavigationService.goToStep(this.form, this.currentStepIndex, this.visibleFormSubmissions());
  }

  private currentPageUrl(): string {
    return this.document.location?.href || this.document.baseURI || '';
  }

  private setupVisibilityTracking(): void {
    this.formDependConditionsService
      .watchVisibility(this.visibilityFields(), this.formGroup)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        this.visibilityState = state;
        this.applyFieldVisibilityToForm(state);
        this.changeDetectorRef.markForCheck();
      });
  }

  private applyFieldVisibilityToForm(state: FieldVisibilityState): void {
    this.formDependConditionsService.syncHiddenControls(this.visibilityFields(), this.formGroup, state);
  }

  private visibilityFields(): EpiserverFieldDefinitionLike[] {
    return this.form.formElements as unknown as EpiserverFieldDefinitionLike[];
  }

  private initializeForm(source: EpiserverFormDefinition): void {
    this.source = source;
    this.form = this.episerverFormAdapterService.adaptForm(source as never);
    const builtForm = this.formSchemaFormService.buildForm(this.form);
    this.formGroup = builtForm.formGroup;
    this.steps = builtForm.steps;
    this.submissionKey = this.episerverFormAdapterService.initialSubmissionKey(source as never);
    this.progressLabel = this.form.localizations?.['pageButtonLabel'] || 'Page';
    this.nextButtonLabel = this.form.localizations?.['nextButtonLabel'] || 'Next';
    this.previousButtonLabel = this.form.localizations?.['previousButtonLabel'] || 'Previous';

    this.setupVisibilityTracking();
    this.setupAutoSave();
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

  private setupAutoSave(): void {
    this.formGroup.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.isSubmitting || !this.source) {
        return;
      }

      this.scheduleAutoSave();
    });
  }

  private scheduleAutoSave(): void {
    this.cancelAutoSave();
    this.autoSaveSubscription = timer(EpiserverFormAccordionComponent.AUTO_SAVE_DELAY_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.autoSaveSubscription = undefined;

        if (this.isSubmitting || !this.source) {
          return;
        }

        this.submit(false);
      });
  }

  private cancelAutoSave(): void {
    this.autoSaveSubscription?.unsubscribe();
    this.autoSaveSubscription = undefined;
  }

  private controlsForStep(step: FormStep) {
    return this.visibleStepFields(step)
      .map(field => this.formGroup.get(field.key))
      .filter((control): control is NonNullable<typeof control> => !!control);
  }

  private markControlsTouched(step: FormStep): void {
    this.controlsForStep(step).forEach(control => control.markAsTouched());
  }

  private markAllControlsTouched(): void {
    Object.values(this.formGroup.controls).forEach(control => control.markAsTouched());
  }

  private patchDraftValues(submissions: FormSubmission[]): void {
    if (!submissions.length) {
      return;
    }

    const patch: Record<string, unknown> = {};

    submissions.forEach(submission => {
      const field = this.form.formElements.find(item => item.key === submission.elementKey);
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
