import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { FormField, FormSchema } from '../models/form-schema.model';

@Injectable({
  providedIn: 'root'
})
export class FormNavigationService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly tempBaseUrl = 'http://temp';

  resolveInitialStepIndex(form: FormSchema, currentPageUrl?: string): number {
    const routeIndex = this.findStepIndexByUrl(form, currentPageUrl);
    if (routeIndex !== null) {
      return routeIndex;
    }

    const cachedStepIndex = this.readCurrentStep(form.key);
    const steps = this.buildSteps(form);
    if (cachedStepIndex !== null && cachedStepIndex >= 0 && cachedStepIndex < steps.length) {
      return cachedStepIndex;
    }

    return 0;
  }

  findNextStep(form: FormSchema, currentStepIndex: number): number {
    return Math.min(currentStepIndex + 1, this.buildSteps(form).length - 1);
  }

  findPreviousStep(_form: FormSchema, currentStepIndex: number): number {
    return Math.max(currentStepIndex - 1, 0);
  }

  persistCurrentStep(formKey: string, stepIndex: number): void {
    this.safeStorage('localStorage')?.setItem(this.currentStepKey(formKey), String(stepIndex));
  }

  readCurrentStep(formKey: string): number | null {
    const cachedValue = this.safeStorage('localStorage')?.getItem(this.currentStepKey(formKey));
    if (!cachedValue) {
      return null;
    }

    const parsed = Number.parseInt(cachedValue, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  clearNavigationState(formKey: string): void {
    this.safeStorage('localStorage')?.removeItem(this.currentStepKey(formKey));
    this.safeStorage('sessionStorage')?.removeItem(formKey);
  }

  saveDraft(formKey: string, formGroup: FormGroup): void {
    this.safeStorage('sessionStorage')?.setItem(formKey, JSON.stringify(formGroup.getRawValue()));
  }

  loadDraft(formKey: string): Record<string, unknown> | null {
    const draft = this.safeStorage('sessionStorage')?.getItem(formKey);
    if (!draft) {
      return null;
    }

    try {
      return JSON.parse(draft) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  goToStep(form: FormSchema, stepIndex: number, formGroup?: FormGroup): void {
    if (formGroup) {
      this.saveDraft(form.key, formGroup);
    }

    this.persistCurrentStep(form.key, stepIndex);
    const attachedContentLink = this.buildSteps(form)[stepIndex]?.formStep.properties.attachedContentLink;
    if (!attachedContentLink) {
      return;
    }

    const targetPath = new URL(attachedContentLink, this.tempBaseUrl).pathname;
    const currentPath = this.document.location?.pathname;
    if (targetPath && targetPath !== currentPath) {
      void this.router.navigateByUrl(targetPath);
    }
  }

  private findStepIndexByUrl(form: FormSchema, currentPageUrl?: string): number | null {
    if (!currentPageUrl) {
      return null;
    }

    const pagePath = new URL(currentPageUrl, this.tempBaseUrl).pathname;
    const steps = this.buildSteps(form);

    for (let index = 0; index < steps.length; index += 1) {
      const attachedContentLink = steps[index].formStep.properties.attachedContentLink;
      if (!attachedContentLink) {
        continue;
      }

      const stepPath = new URL(attachedContentLink, this.tempBaseUrl).pathname;
      if (stepPath === pagePath) {
        return index;
      }
    }

    return null;
  }

  private buildSteps(form: FormSchema): Array<{ formStep: FormField }> {
    const steps: Array<{ formStep: FormField }> = [];
    let currentStep = form.formElements.find((field) => field.contentType === 'FormStepBlock') ?? {
      key: form.key + '-step-0',
      contentType: 'FormStepBlock',
      properties: { label: form.properties.title }
    };

    for (const field of form.formElements) {
      if (field.contentType === 'FormStepBlock') {
        currentStep = field;
        steps.push({ formStep: currentStep });
      }
    }

    if (steps.length === 0) {
      steps.push({ formStep: currentStep });
    }

    return steps;
  }

  private currentStepKey(formKey: string): string {
    return 'form_current_step_' + formKey;
  }

  private safeStorage(storageType: 'localStorage' | 'sessionStorage'): Storage | null {
    try {
      return this.document.defaultView?.[storageType] ?? null;
    } catch {
      return null;
    }
  }
}
