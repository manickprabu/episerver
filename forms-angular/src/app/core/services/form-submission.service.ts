import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { Observable, throwError } from 'rxjs';
import { FormField, FormSchema, FormServerValidationError, FormSubmissionData, FormSubmissionResult } from '../models/form-schema.model';

@Injectable({
  providedIn: 'root'
})
export class FormSubmissionService {
  private readonly httpClient = inject(HttpClient);

  buildSubmissionData(
    form: FormSchema,
    formGroup: FormGroup,
    currentStepIndex: number,
    hostedPageUrl?: string,
    accessToken?: string,
    isFinalized = true,
    submissionKey?: string
  ): FormSubmissionData {
    return {
      formKey: form.key,
      locale: form.locale,
      fields: this.serializeFields(form.formElements, formGroup),
      isFinalized,
      hostedPageUrl,
      currentStepIndex,
      accessToken,
      submissionKey
    };
  }

  submit(baseUrl: string, payload: FormSubmissionData): Observable<FormSubmissionResult> {
    const formData = this.toFormData(payload);
    const headers = payload.accessToken
      ? new HttpHeaders({ Authorization: `Bearer ${payload.accessToken}` })
      : undefined;

    return this.httpClient.put<FormSubmissionResult>(`${baseUrl}_forms/v1/forms`, formData, { headers });
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

  ensureValid(formGroup: FormGroup): Observable<never> | null {
    formGroup.markAllAsTouched();
    if (formGroup.valid) {
      return null;
    }

    return throwError(() => new Error('Form validation failed.'));
  }

  firstInvalidControlKey(formGroup: FormGroup): string | null {
    return Object.entries(formGroup.controls).find(([, control]) => control.invalid)?.[0] ?? null;
  }

  toFormData(payload: FormSubmissionData): FormData {
    const formData = new FormData();
    const fields: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(payload.fields)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        const files = value as Array<{ name?: string; file?: File }>;
        let names = '';

        files.forEach((entry, index) => {
          if (entry.file instanceof File) {
            formData.append(`${key}_file_${index}`, entry.file);
          }
          names += `${index > 0 ? ' | ' : ''}${entry.name ?? entry.file?.name ?? ''}`;
        });

        formData.append(key, names);
        continue;
      }

      fields[key] = value;
    }

    formData.append(
      'data',
      JSON.stringify({
        FormKey: payload.formKey,
        Locale: payload.locale,
        IsFinalized: payload.isFinalized,
        SubmissionKey: payload.submissionKey ?? '',
        HostedPageUrl: payload.hostedPageUrl,
        CurrentStep: payload.currentStepIndex,
        Fields: fields
      })
    );

    return formData;
  }

  private serializeFields(fields: FormField[], formGroup: FormGroup): Record<string, unknown> {
    return fields.reduce<Record<string, unknown>>((acc, field) => {
      if (field.contentType === 'FormStepBlock') {
        return acc;
      }

      const control = formGroup.get(field.key);
      if (!control) {
        return acc;
      }

      acc[field.key] = this.serializeValue(field, control);
      return acc;
    }, {});
  }

  private serializeValue(field: FormField, control: AbstractControl): unknown {
    const value = control.value;
    if (Array.isArray(value)) {
      if (field.contentType === 'FileUploadElementBlock') {
        return value;
      }
      return value.join(',');
    }

    return value;
  }
}
