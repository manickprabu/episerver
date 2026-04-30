import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { from, Observable } from 'rxjs';

import {
  FormSubmission,
  FormSubmitModel,
  FormSubmitService as SdkFormSubmitService,
  FormValidationResult
} from '../../episerver-forms/sdk';
import { FormField, FormSchema, FormServerValidationError, FormSubmissionResult } from '../models/form-schema.model';

@Injectable()
export class FormSubmissionService {
  constructor(private readonly sdkFormSubmitService: SdkFormSubmitService) {}

  toFormSubmissions(form: FormSchema, formGroup: FormGroup): FormSubmission[] {
    return form.formElements
      .filter((field) => field.contentType !== 'FormStepBlock')
      .map((field) => ({
        elementKey: field.key,
        value: this.serializeValue(field as FormField, formGroup.get(field.key))
      }));
  }

  collectCurrentStepSubmissions(
    form: FormSchema,
    formGroup: FormGroup,
    currentStepIndex: number,
    inactiveElements: string[]
  ): FormSubmission[] {
    const currentStepKeys = new Set(
      (form.steps[currentStepIndex]?.elements ?? [])
        .filter((field) => field.contentType !== 'FormStepBlock')
        .map((field) => field.key)
    );

    return this.toFormSubmissions(form, formGroup).filter(
      (submission) => currentStepKeys.has(submission.elementKey) && !inactiveElements.includes(submission.elementKey)
    );
  }

  validateStep(form: FormSchema, submissions: FormSubmission[]): FormValidationResult[] {
    return this.sdkFormSubmitService.doValidate(form, submissions);
  }

  applyValidationResults(formGroup: FormGroup, results: FormValidationResult[]): void {
    for (const result of results) {
      const control = formGroup.get(result.elementKey);
      if (!control) {
        continue;
      }

      const nextErrors = { ...(control.errors ?? {}) };

      if (result.result.valid) {
        delete nextErrors['sdk'];
      } else {
        nextErrors['sdk'] = result.result.message;
      }

      control.setErrors(Object.keys(nextErrors).length > 0 ? nextErrors : null);
      control.markAsTouched();
    }
  }

  clearValidationResults(formGroup: FormGroup, fieldKeys: string[]): void {
    for (const fieldKey of fieldKeys) {
      const control = formGroup.get(fieldKey);
      if (!control?.errors?.['sdk']) {
        continue;
      }

      const nextErrors = { ...(control.errors ?? {}) };
      delete nextErrors['sdk'];
      control.setErrors(Object.keys(nextErrors).length > 0 ? nextErrors : null);
    }
  }

  buildSubmitModel(
    form: FormSchema,
    submissions: FormSubmission[],
    currentStepIndex: number,
    hostedPageUrl: string,
    accessToken: string | undefined,
    isFinalized: boolean,
    partialSubmissionKey: string
  ): FormSubmitModel {
    return {
      formKey: form.key,
      locale: form.locale,
      submissionData: submissions,
      isFinalized,
      partialSubmissionKey,
      hostedPageUrl,
      accessToken,
      currentStepIndex
    };
  }

  submit(form: FormSchema, baseUrl: string, model: FormSubmitModel): Observable<FormSubmissionResult> {
    return from(this.sdkFormSubmitService.doSubmit(form, baseUrl, model));
  }

  applyServerValidation(formGroup: FormGroup, error: FormServerValidationError): void {
    for (const [fieldKey, messages] of Object.entries(error.errors ?? {})) {
      const control = formGroup.get(fieldKey);
      if (!control) {
        continue;
      }

      control.setErrors({ ...(control.errors ?? {}), server: messages.join(' ') });
      control.markAsTouched();
    }
  }

  firstInvalidControlKey(formGroup: FormGroup, allowedKeys?: string[]): string | null {
    const allowed = allowedKeys ? new Set(allowedKeys) : null;

    return (
      Object.entries(formGroup.controls).find(([key, control]) => (!allowed || allowed.has(key)) && control.invalid)?.[0] ?? null
    );
  }

  private serializeValue(field: FormField, control: AbstractControl | null): unknown {
    const value = control?.value;
    if (Array.isArray(value)) {
      if (field.contentType === 'FileUploadElementBlock') {
        return value;
      }

      return value.join(',');
    }

    return value;
  }
}
