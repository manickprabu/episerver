import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, Inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';

import { FormDependConditionsService } from '../../episerver-forms/episerver-sdk';
import { EpiserverFormDefinition } from '../../episerver-forms/models/episerver-form-definition.model';
import { FormField, FormSchema, FormStep } from '../../episerver-forms/models/form-schema.model';
import { FormSchemaFormService } from '../../episerver-forms/services/form-schema-form.service';
import { FormSubmissionService } from '../../episerver-forms/services/form-submission.service';
import { EpiserverNewFormService } from './episerver-new-form.service';

@Component({
  selector: 'app-episerver-new-form',
  standalone: false,
  templateUrl: './episerver-new-form.component.html',
  styleUrls: ['./episerver-new-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EpiserverNewFormComponent {
  protected isLoading = true;
  protected source!: EpiserverFormDefinition;
  protected form!: FormSchema;
  protected formGroup!: FormGroup;
  protected steps: FormStep[] = [];
  protected currentStepIndex = 0;
  protected hasSubmitted = false;
  protected isSubmitting = false;
  protected submitSucceeded = false;
  protected statusMessage = '';
  protected dependencyInactiveElements: string[] = [];
  protected libraryPreviewOpen = false;

  private elementDependencies: Array<{ elementKey: string; isSatisfied: boolean; sastisfiedAction?: string }> = [];

  constructor(
    @Inject(DOCUMENT) protected readonly document: Document,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly destroyRef: DestroyRef,
    private readonly episerverNewFormService: EpiserverNewFormService,
    private readonly formDependConditionsService: FormDependConditionsService,
    private readonly formSchemaFormService: FormSchemaFormService,
    private readonly formSubmissionService: FormSubmissionService
  ) {
    this.episerverNewFormService.loadMockForm().subscribe({
      next: (source) => this.initializeForm(source),
      error: () => {
        this.isLoading = false;
        this.statusMessage = 'Unable to load mock form data.';
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  protected get validationCssClass(): string {
    return this.hasSubmitted && this.formGroup?.invalid ? 'validationFail' : 'validationSuccess';
  }

  protected isStepOpen(stepIndex: number): boolean {
    return this.currentStepIndex === stepIndex;
  }

  protected openStep(stepIndex: number): void {
    this.currentStepIndex = stepIndex;
  }

  protected toggleLibraryPreview(): void {
    this.libraryPreviewOpen = !this.libraryPreviewOpen;
  }

  protected visibleStepFields(step: FormStep): FormField[] {
    return step.elements.filter(
      (field) => field.contentType !== 'FormStepBlock' && !this.dependencyInactiveElements.includes(field.key)
    ) as FormField[];
  }

  protected stepTitle(step: FormStep, index: number): string {
    const fieldKeys = new Set(step.elements.map((field) => field.key));
    return this.episerverNewFormService.stepTitle(this.source, fieldKeys, `Step ${index + 1}`);
  }

  protected submitForm(): void {
    this.hasSubmitted = true;
    this.statusMessage = '';

    const visibleFields = this.form.formElements.filter(
      (field) => field.contentType !== 'FormStepBlock' && !this.dependencyInactiveElements.includes(field.key)
    );
    const fieldKeys = visibleFields.map((field) => field.key);
    const submissions = this.formSubmissionService
      .toFormSubmissions(this.form, this.formGroup)
      .filter((submission) => !this.dependencyInactiveElements.includes(submission.elementKey));

    this.formSubmissionService.clearValidationResults(this.formGroup, fieldKeys);
    const validationResults = this.formSubmissionService.validateStep(this.form, submissions);
    this.formSubmissionService.applyValidationResults(this.formGroup, validationResults);
    this.markVisibleControlsTouched(fieldKeys);

    if (validationResults.some((result) => !result.result.valid)) {
      this.submitSucceeded = false;
      this.focusFirstInvalidControl(fieldKeys);
      return;
    }

    this.submitSucceeded = true;
    this.statusMessage = 'Mock form submitted successfully.';
  }

  private initializeForm(source: EpiserverFormDefinition): void {
    this.source = source;
    this.form = this.episerverNewFormService.buildFormSchema(source);

    const builtForm = this.formSchemaFormService.buildForm(this.form);
    this.form = builtForm.form;
    this.formGroup = builtForm.formGroup;
    this.steps = builtForm.steps;
    this.isLoading = false;

    this.refreshDependencies();

    this.formGroup.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.refreshDependencies();
      this.changeDetectorRef.markForCheck();
    });
  }

  private refreshDependencies(): void {
    const submissions = this.formSubmissionService.toFormSubmissions(this.form, this.formGroup);
    const nextDependencies: Array<{ elementKey: string; isSatisfied: boolean; sastisfiedAction?: string }> = [];
    const inactiveElements: string[] = [];

    for (const field of this.form.formElements) {
      const satisfiedAction = String(field.properties['satisfiedAction'] ?? '');
      const hasConditions = Array.isArray(field.properties['conditions']) && field.properties['conditions'].length > 0;

      if (!satisfiedAction || !hasConditions) {
        continue;
      }

      const isSatisfied = this.formDependConditionsService.checkConditions(field, submissions, this.elementDependencies);
      const normalizedAction = satisfiedAction.toLowerCase();
      const isVisible = isSatisfied ? normalizedAction === 'show' : normalizedAction === 'hide';

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
  }

  private markVisibleControlsTouched(fieldKeys: string[]): void {
    fieldKeys.forEach((fieldKey) => this.formGroup.get(fieldKey)?.markAsTouched());
  }

  private focusFirstInvalidControl(fieldKeys: string[]): void {
    const invalidKey = fieldKeys.find((fieldKey) => this.formGroup.get(fieldKey)?.invalid);
    if (!invalidKey) {
      return;
    }

    queueMicrotask(() => {
      const target = this.document.getElementById(invalidKey) as HTMLElement | null;
      target?.focus();
    });
  }
}
