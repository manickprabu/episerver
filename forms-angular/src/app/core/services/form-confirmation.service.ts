import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormField, FormSchema } from '../models/form-schema.model';
import { FormSchemaFormService } from './form-schema-form.service';

@Injectable({
  providedIn: 'root'
})
export class FormConfirmationService {
  constructor(private readonly formSchemaFormService: FormSchemaFormService) {}

  buildSummary(form: FormSchema, formGroup: FormGroup, currentStepIndex: number): string {
    const steps = this.formSchemaFormService.buildSteps(form);
    const step = steps[currentStepIndex];
    if (!step) {
      return '';
    }

    return step.elements
      .filter((field) => !this.isNonDataField(field))
      .map((field) => this.formatFieldValue(field, formGroup.get(field.key)?.value))
      .filter(Boolean)
      .join('\n');
  }

  private formatFieldValue(field: FormField, value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const label = field.properties.label || field.displayName || field.key;

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '';
      }

      if (typeof value[0] === 'object') {
        const names = (value as Array<{ name?: string; file?: File }>).map((entry) => entry.name ?? entry.file?.name ?? '').filter(Boolean);
        return names.length ? `${label}: ${names.join(', ')}` : '';
      }

      return `${label}: ${value.join(', ')}`;
    }

    return `${label}: ${String(value)}`;
  }

  private isNonDataField(field: FormField): boolean {
    return ['FormStepBlock', 'ParagraphTextElementBlock', 'ResetButtonElementBlock', 'SubmitButtonElementBlock'].includes(field.contentType);
  }
}
