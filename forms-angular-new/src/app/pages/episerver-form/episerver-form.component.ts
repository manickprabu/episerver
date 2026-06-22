import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, Inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';

import { FieldVisibilityState, FormDependConditionsService, FormSubmission } from '../../episerver-forms/episerver-sdk';
import { EpiserverFormAdapterService } from '../../episerver-forms/services/episerver-form-adapter.service';
import { FormSchemaFormService } from '../../episerver-forms/services/form-schema-form.service';
import { FormSubmissionService } from '../../episerver-forms/services/form-submission.service';
import { FormField, FormSchema, FormStep } from '../../episerver-forms/models/form-schema.model';
import { EpiserverFormDefinition } from '../../episerver-forms/models/episerver-form-definition.model';
import { EpiserverFormService } from './episerver-form.service';

@Component({
  selector: 'app-episerver-form',
  standalone: false,
  templateUrl: './episerver-form.component.html',
  styleUrls: ['./episerver-form.component.scss']
  //changeDetection: ChangeDetectionStrategy.OnPush
})
export class EpiserverFormComponent {
  protected isLoading = true;
  protected source!: EpiserverFormDefinition;
  protected form!: FormSchema;
  protected formGroup!: FormGroup;
  protected steps: FormStep[] = [];
  protected endpoint = '';
  protected readonly openStepIndexes = new Set<number>([0]);
  protected currentStepIndex = 0;
  protected isSubmitting = false;
  protected hasSubmitted = false;
  protected submitSucceeded = false;
  protected isWarningStatus = false;
  protected isReadOnlyMode = false;
  protected statusMessage = '';
  protected submissionKey = '';
  protected visibilityState: FieldVisibilityState = { visibilityByGuid: {}, visibilityByContentLinkId: {}, evaluations: [] };
  private readonly dependencyDisabledKeys = new Set<string>();

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly destroyRef: DestroyRef,
    private readonly episerverFormService: EpiserverFormService,
    private readonly episerverFormAdapterService: EpiserverFormAdapterService,
    private readonly formSchemaFormService: FormSchemaFormService,
    private readonly formSubmissionService: FormSubmissionService,
    private readonly formDependConditionsService: FormDependConditionsService
  ) {
    this.endpoint = this.episerverFormService.endpoint;

    this.episerverFormService.loadForm().subscribe({
      next: source => this.initializeForm(source),
      error: () => {
        this.isLoading = false;
        this.setWarningStatus('Unable to load form from http://localhost:8000/test-episerver-form.');
      }
    });
  }

  protected get validationCssClass(): string {
    return this.hasSubmitted && this.formGroup.invalid ? 'validationFail' : 'validationSuccess';
  }

  protected get apiBaseURLPrefix(): string {
    return this.episerverFormService.apiBaseURLPrefix;
  }

  protected openStep(stepIndex: number): void {
    this.currentStepIndex = stepIndex;

    if (this.openStepIndexes.has(stepIndex)) {
      this.openStepIndexes.delete(stepIndex);
      return;
    }

    this.openStepIndexes.add(stepIndex);
  }

  protected isStepOpen(stepIndex: number): boolean {
    return this.openStepIndexes.has(stepIndex);
  }

  protected accordionBorderColor(step: FormStep, stepIndex: number): string {
    if (this.isStepComplete(step)) {
      return 'rgba(22, 163, 74, 0.35)';
    }

    if (this.isStepOpen(stepIndex)) {
      return 'rgba(59, 130, 246, 0.45)';
    }

    return 'rgba(15, 23, 42, 0.14)';
  }

  protected accordionIcon(step: FormStep): string {
    return this.isStepComplete(step) ? '✓' : '•';
  }

  protected accordionPillColor(step: FormStep, stepIndex: number): string {
    if (this.isStepComplete(step)) {
      return '#16a34a';
    }

    if (this.isStepInProgress(step, stepIndex)) {
      return '#2563eb';
    }

    return '#64748b';
  }

  protected accordionPillText(step: FormStep, stepIndex: number): string {
    if (this.isStepComplete(step)) {
      return 'Completed';
    }

    if (this.isStepInProgress(step, stepIndex)) {
      return 'In Progress';
    }

    return 'To do';
  }

  protected stepHeading(step: FormStep, stepIndex: number): string {
    if (stepIndex === 0) {
      const firstStepTitle = this.firstStepHiddenTitle(step);
      if (firstStepTitle) {
        return this.numberedSectionTitle(stepIndex, firstStepTitle);
      }
    }

    const formStepTitle = this.formStepTitle(step);
    if (formStepTitle) {
      return this.numberedSectionTitle(stepIndex, formStepTitle);
    }

    return this.numberedSectionTitle(stepIndex, 'Step ' + (stepIndex + 1));
  }

  protected stepDescription(step: FormStep): string {
    const stepProperties = (step.formStep.properties ?? {}) as Record<string, unknown>;
    const description = stepProperties['description'];
    return typeof description === 'string' ? description.trim() : '';
  }

  protected visibleStepFields(step: FormStep): FormField[] {
    return step.elements.filter(field => field.contentType !== 'FormStepBlock' && this.isFieldVisible(field.key)) as FormField[];
  }

  protected savePartial(): void {
    if (this.isReadOnlyMode) {
      return;
    }

    this.submit(false);
  }

  protected submitFinal(): void {
    if (this.isReadOnlyMode) {
      return;
    }

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

  protected trackStep(_index: number, step: FormStep): string {
    return step.formStep.key;
  }

  private submit(isFinalized: boolean): void {
    this.isSubmitting = true;

    const submissions = this.visibleFormSubmissions();
    const model = this.formSubmissionService.buildSubmitModel(this.form, submissions, this.currentStepIndex, this.currentPageUrl(), undefined, isFinalized, this.submissionKey);

    const request = isFinalized ? this.episerverFormService.submitFinal(this.source, model) : this.episerverFormService.savePartial(this.source, model);

    request.subscribe({
      next: result => {
        this.submissionKey = result.submissionKey ?? this.submissionKey;
        this.submitSucceeded = Boolean(result.success && isFinalized);
        this.isWarningStatus = false;
        this.statusMessage = result.messages?.map(message => message.message).join('<br>') || (isFinalized ? this.form.properties.submitSuccessMessage || 'Thanks, your form has been submitted.' : 'Draft saved.');
        this.isSubmitting = false;
        this.changeDetectorRef.markForCheck();
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

  private initializeForm(source: EpiserverFormDefinition): void {
    this.source = source;
    this.isReadOnlyMode = Boolean(source.isFinalised ?? source.isFinalized);
    this.form = this.episerverFormAdapterService.adaptForm(source);
    const builtForm = this.formSchemaFormService.buildForm(this.form);
    this.form = builtForm.form;
    this.formGroup = builtForm.formGroup;
    this.steps = builtForm.steps;
    this.submissionKey = this.episerverFormAdapterService.initialSubmissionKey(source);
    this.applyQuestionNumbers();
    this.patchSourceValues();

    const initialVisibilityState = this.formDependConditionsService.evaluateFieldVisibility(this.form.formElements, this.formGroup.getRawValue() as Record<string, unknown>);
    this.visibilityState = initialVisibilityState;
    this.formDependConditionsService.syncHiddenControls(this.form.formElements, this.formGroup, initialVisibilityState, this.dependencyDisabledKeys);

    if (this.isReadOnlyMode) {
      this.formGroup.disable({ emitEvent: false });
      this.statusMessage = 'This form has already been finalised and is now read-only.';
      this.isWarningStatus = false;
    }

    this.setupVisibilityTracking();
    this.isLoading = false;
    this.changeDetectorRef.markForCheck();
  }

  private patchSourceValues(): void {
    for (const sourceField of this.source.fields) {
      const control = this.formGroup.get(sourceField.contentGuid);
      if (!control || sourceField.value === undefined) {
        continue;
      }

      control.patchValue(this.normalizeSourceValue(sourceField.value, sourceField.type, Boolean(sourceField.properties.AllowMultiSelect)), {
        emitEvent: false
      });
    }
  }

  private applyQuestionNumbers(): void {
    this.steps.forEach((step, stepIndex) => {
      let questionIndex = 0;

      step.elements.forEach(field => {
        const formField = field as FormField;

        if (!this.shouldNumberField(formField)) {
          return;
        }

        questionIndex += 1;
        formField.properties.label = `${questionIndex}. ${this.stripExistingQuestionNumber(formField.properties.label)}`;
      });
    });
  }

  private shouldNumberField(field: FormField): boolean {
    return !['FormStepBlock', 'PredefinedHiddenElementBlock', 'SubmitButtonElementBlock', 'ResetButtonElementBlock', 'ParagraphTextElementBlock'].includes(field.contentType);
  }

  private stripExistingQuestionNumber(label: string): string {
    return label.replace(/^\d+(?:\.\d+)?[.)]?\s+/, '');
  }

  private numberedSectionTitle(stepIndex: number, title: string): string {
    return `${stepIndex + 1}. ${title}`;
  }

  private isStepInProgress(step: FormStep, stepIndex: number): boolean {
    return this.isStepOpen(stepIndex) || this.stepHasAnyValue(step);
  }

  private isStepComplete(step: FormStep): boolean {
    const fields = this.visibleStepFields(step).filter(field => this.shouldTrackStepProgress(field));
    return fields.length > 0 && fields.every(field => this.isFieldFilled(field));
  }

  private stepHasAnyValue(step: FormStep): boolean {
    return this.visibleStepFields(step)
      .filter(field => this.shouldTrackStepProgress(field))
      .some(field => this.isFieldFilled(field));
  }

  private shouldTrackStepProgress(field: FormField): boolean {
    return !['PredefinedHiddenElementBlock', 'ParagraphTextElementBlock', 'SubmitButtonElementBlock', 'ResetButtonElementBlock'].includes(field.contentType);
  }

  private isFieldFilled(field: FormField): boolean {
    const control = this.formGroup.get(field.key);
    if (!control || control.disabled) {
      return false;
    }

    const value = control.value;
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== null && value !== undefined && value !== '';
  }

  private formStepTitle(step: FormStep): string {
    const stepProperties = (step.formStep.properties ?? {}) as Record<string, unknown>;
    const label = stepProperties['label'];
    return typeof label === 'string' ? label.trim() : '';
  }

  private firstStepHiddenTitle(step: FormStep): string {
    const stepFieldKeys = new Set(step.elements.map(field => field.key));
    const rawTitleField = this.source.fields.find(
      field =>
        stepFieldKeys.has(field.contentGuid) &&
        field.name === 'Title' &&
        field.type === 'PredefinedHiddenElementBlockProxy' &&
        typeof field.properties.PredefinedValue === 'string' &&
        field.properties.PredefinedValue.trim().length > 0
    );

    return rawTitleField?.properties.PredefinedValue?.trim() ?? '';
  }

  private normalizeSourceValue(value: unknown, sourceFieldType: string, allowMultiSelect: boolean): unknown {
    if (sourceFieldType === 'FileUploadElementBlockProxy') {
      return this.normalizeUploadedFiles(value);
    }

    if (!allowMultiSelect) {
      return value;
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string') {
      return value
        ? value
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
        : [];
    }

    return value;
  }

  private normalizeUploadedFiles(value: unknown): Array<{ name?: string; size?: number; url?: string }> {
    const parsed = this.parseUploadedFilesValue(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(entry => this.normalizeUploadedFile(entry))
      .filter((entry): entry is { name?: string; size?: number; url?: string } => entry !== null);
  }

  private parseUploadedFilesValue(value: unknown): unknown {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      return [];
    }
  }

  private normalizeUploadedFile(value: unknown): { name?: string; size?: number; url?: string } | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const file = value as Record<string, unknown>;
    const name = this.readString(file, ['name', 'Name', 'fileName', 'FileName']);
    const url = this.readString(file, ['url', 'Url', 'downloadUrl', 'DownloadUrl', 'value', 'Value']);
    const size = this.readNumber(file, ['size', 'Size']);

    if (!name && !url) {
      return null;
    }

    return {
      name: name ?? url?.split('/').pop() ?? 'File',
      size: size ?? undefined,
      url: url ?? undefined
    };
  }

  private readString(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return null;
  }

  private readNumber(source: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
    }

    return null;
  }

  private setupVisibilityTracking(): void {
    this.formDependConditionsService
      .watchVisibility(this.form.formElements, this.formGroup)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        this.visibilityState = state;
        this.formDependConditionsService.syncHiddenControls(this.form.formElements, this.formGroup, state, this.dependencyDisabledKeys);
        this.changeDetectorRef.markForCheck();
      });
  }

  private currentPageUrl(): string {
    return this.document.location?.href || this.document.baseURI || '';
  }

  private isFieldVisible(fieldKey: string): boolean {
    return this.formDependConditionsService.isFieldVisible(fieldKey, this.visibilityState);
  }

  private visibleFormFields(): FormField[] {
    return this.form.formElements.filter(field => field.contentType !== 'FormStepBlock' && this.isFieldVisible(field.key)) as FormField[];
  }

  private visibleFormSubmissions(): FormSubmission[] {
    const visibleKeys = new Set(this.visibleFormFields().map(field => field.key));

    return this.formSubmissionService.toFormSubmissions(this.form, this.formGroup).filter(submission => visibleKeys.has(submission.elementKey) || submission.elementKey.startsWith('__'));
  }

  private focusFirstInvalidControl(allowedKeys?: string[]): void {
    const invalidKey = this.formSubmissionService.firstInvalidControlKey(this.formGroup, allowedKeys);
    if (!invalidKey) {
      return;
    }

    const invalidElement = this.document.getElementById(invalidKey) as HTMLElement | null;
    invalidElement?.focus();
  }

  private markAllControlsTouched(): void {
    Object.values(this.formGroup.controls).forEach(control => control.markAsTouched());
  }

  private setWarningStatus(message: string): void {
    this.submitSucceeded = false;
    this.isWarningStatus = true;
    this.statusMessage = message;
    this.changeDetectorRef.markForCheck();
  }
}
