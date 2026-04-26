import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PageShellComponent } from '../../../../shared/components/page-shell/page-shell.component';
import { DynamicFieldComponent } from '../../../../shared/components/forms/dynamic-field/dynamic-field.component';
import { FormStepNavigationComponent } from '../../../../shared/components/forms/form-step-navigation/form-step-navigation.component';
import { DynamicEpiServerForm } from '../../../../core/models/dynamic-episerver-form.model';
import { FormSchema, FormSubmissionResult } from '../../../../core/models/form-schema.model';
import { DynamicFormAdapterService } from '../../../../core/services/dynamic-form-adapter.service';
import { FormNavigationService } from '../../../../core/services/form-navigation.service';
import { FormSchemaFormService } from '../../../../core/services/form-schema-form.service';
import { FormSubmissionService } from '../../../../core/services/form-submission.service';
import { SAMPLE_DYNAMIC_JSON_FORM } from './dynamic-json-form-page.data';

@Component({
  selector: 'app-dynamic-json-form-page',
  standalone: true,
  imports: [PageShellComponent, ReactiveFormsModule, DynamicFieldComponent, FormStepNavigationComponent],
  templateUrl: './dynamic-json-form-page.component.html',
  styleUrl: './dynamic-json-form-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicJsonFormPageComponent {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly httpClient = inject(HttpClient);
  private readonly dynamicFormAdapterService = inject(DynamicFormAdapterService);
  private readonly formNavigationService = inject(FormNavigationService);
  private readonly formSchemaFormService = inject(FormSchemaFormService);
  private readonly formSubmissionService = inject(FormSubmissionService);

  protected readonly source = signal<DynamicEpiServerForm>(SAMPLE_DYNAMIC_JSON_FORM);
  protected readonly form = signal<FormSchema>(this.dynamicFormAdapterService.adaptForm(SAMPLE_DYNAMIC_JSON_FORM));
  protected readonly builtForm = signal(this.formSchemaFormService.buildForm(this.form()));
  protected readonly currentStepIndex = signal(0);
  protected readonly isSubmitting = signal(false);
  protected readonly hasSubmitted = signal(false);
  protected readonly submitSucceeded = signal(false);
  protected readonly isWarningStatus = signal(false);
  protected readonly statusMessage = signal('');
  protected readonly submissionKey = signal(this.dynamicFormAdapterService.initialSubmissionKey(SAMPLE_DYNAMIC_JSON_FORM));
  protected readonly baseUrl = signal('');

  protected readonly formGroup = computed(() => this.builtForm().formGroup);
  protected readonly steps = computed(() => this.builtForm().steps);
  protected readonly currentStep = computed(() => this.steps()[this.currentStepIndex()] ?? null);
  protected readonly hasMultipleSteps = computed(() => this.steps().length > 1);
  protected readonly canGoPrevious = computed(() => this.currentStepIndex() > 0);
  protected readonly canGoNext = computed(() => this.currentStepIndex() < this.steps().length - 1);
  protected readonly progressLabel = computed(() => this.form().localizations?.['pageButtonLabel'] || 'Page');
  protected readonly nextButtonLabel = computed(() => this.form().localizations?.['nextButtonLabel'] || 'Next');
  protected readonly previousButtonLabel = computed(() => this.form().localizations?.['previousButtonLabel'] || 'Previous');
  protected readonly validationCssClass = computed(() => (this.hasSubmitted() && this.formGroup().invalid ? 'ValidationFail' : 'ValidationSuccess'));
  protected readonly draftModeLabel = computed(() =>
    this.baseUrl()
      ? 'Save progress to the form API as a partial submission.'
      : 'Save progress locally. Add ?baseUrl=https://your-site/ to enable server partial submissions.'
  );

  constructor() {
    const builtForm = this.formSchemaFormService.buildForm(this.form());
    const savedDraft = this.formNavigationService.loadDraft(this.form().key);
    if (savedDraft) {
      builtForm.formGroup.patchValue(savedDraft);
    }

    this.builtForm.set(builtForm);
    this.currentStepIndex.set(this.formNavigationService.resolveInitialStepIndex(this.form(), this.currentPageUrl()));
    this.baseUrl.set(this.activatedRoute.snapshot.queryParamMap.get('baseUrl') ?? '');
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

  protected previousStep(): void {
    if (!this.canGoPrevious()) {
      return;
    }

    const previousStepIndex = this.formNavigationService.findPreviousStep(this.form(), this.currentStepIndex());
    this.currentStepIndex.set(previousStepIndex);
    this.formNavigationService.goToStep(this.form(), previousStepIndex, this.formGroup());
  }

  protected savePartial(): void {
    this.formNavigationService.goToStep(this.form(), this.currentStepIndex(), this.formGroup());

    if (!this.baseUrl()) {
      this.submitSucceeded.set(false);
      this.isWarningStatus.set(false);
      this.statusMessage.set('Draft saved locally in session storage.');
      return;
    }

    this.submit(false);
  }

  protected submitFinal(): void {
    this.hasSubmitted.set(true);

    const invalid = this.formSubmissionService.ensureValid(this.formGroup());
    if (invalid) {
      invalid.subscribe({ error: () => undefined });
      this.focusFirstInvalidControl();
      return;
    }

    this.submit(true);
  }

  protected handleReset(): void {
    this.formGroup().reset(this.builtForm().initialValue);
    this.currentStepIndex.set(0);
    this.hasSubmitted.set(false);
    this.submitSucceeded.set(false);
    this.isWarningStatus.set(false);
    this.statusMessage.set('');
    this.submissionKey.set(this.dynamicFormAdapterService.initialSubmissionKey(this.source()));
    this.formNavigationService.clearNavigationState(this.form().key);
  }

  private submit(isFinalized: boolean): void {
    if (!this.baseUrl()) {
      this.setWarningStatus('No base URL configured. Use ?baseUrl=https://your-site/ to send this form to the API.');
      return;
    }

    this.isSubmitting.set(true);

    const payload = this.formSubmissionService.buildSubmissionData(
      this.form(),
      this.formGroup(),
      this.currentStepIndex(),
      this.currentPageUrl(),
      undefined,
      isFinalized,
      this.submissionKey()
    );

    const headers = this.buildHeaders();
    this.httpClient
      .put<FormSubmissionResult>(`${this.baseUrl()}_forms/v1/forms`, this.formSubmissionService.toFormData(payload), { headers })
      .subscribe({
        next: (result) => {
          this.submissionKey.set(result.submissionKey ?? this.submissionKey());
          this.submitSucceeded.set(result.success && isFinalized);
          this.isWarningStatus.set(false);
          this.statusMessage.set(
            result.messages?.map((message) => message.message).join('<br>') ||
              (isFinalized ? this.form().properties.submitSuccessMessage || 'Thanks, your form has been submitted.' : 'Draft saved.')
          );
          this.isSubmitting.set(false);

          if (isFinalized && result.success) {
            this.formNavigationService.clearNavigationState(this.form().key);
          } else {
            this.formNavigationService.goToStep(this.form(), this.currentStepIndex(), this.formGroup());
          }
        },
        error: (error) => {
          this.formSubmissionService.applyServerValidation(this.formGroup(), error);
          this.setWarningStatus(error?.detail || 'Form submission failed.');
          this.isSubmitting.set(false);
          this.focusFirstInvalidControl();
        }
      });
  }

  private buildHeaders(): HttpHeaders | undefined {
    const antiforgery = this.source().antiforgery;
    if (!antiforgery) {
      return undefined;
    }

    return new HttpHeaders({
      [antiforgery.headerName]: antiforgery.token
    });
  }

  private currentPageUrl(): string {
    return this.document.location?.href || this.document.baseURI || '';
  }

  private focusFirstInvalidControl(): void {
    const invalidKey = this.formSubmissionService.firstInvalidControlKey(this.formGroup());
    if (!invalidKey) {
      return;
    }

    const invalidElement = this.document.getElementById(invalidKey) as HTMLElement | null;
    invalidElement?.focus();
  }

  private setWarningStatus(message: string): void {
    this.submitSucceeded.set(false);
    this.isWarningStatus.set(true);
    this.statusMessage.set(message);
  }
}
