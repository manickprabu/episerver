import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import {
  FormCacheService,
  FormConstants,
  FormStorageService,
  FormSubmission,
  StepDependConditionService,
  StepHelperService
} from '../../episerver-forms/episerver-sdk';
import { FormSchema } from '../models/form-schema.model';

@Injectable()
export class FormNavigationService {
  private readonly tempBaseUrl = 'http://temp';

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly router: Router,
    private readonly formCacheService: FormCacheService,
    private readonly formStorageService: FormStorageService,
    private readonly stepDependConditionService: StepDependConditionService,
    private readonly stepHelperService: StepHelperService
  ) {}

  resolveInitialStepIndex(form: FormSchema, currentPageUrl?: string): number {
    const cachedStepIndex = this.formCacheService.get<string>(FormConstants.FormCurrentStep + form.key);
    if (cachedStepIndex) {
      const parsed = Number.parseInt(cachedStepIndex, 10);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed < form.steps.length) {
        return parsed;
      }
    }

    return this.stepHelperService.getCurrentStepIndex(form, currentPageUrl);
  }

  findNextStep(form: FormSchema, currentStepIndex: number, inactiveElements: string[]): number {
    return this.stepDependConditionService.findNextStep(form, currentStepIndex, inactiveElements) ?? currentStepIndex;
  }

  findPreviousStep(form: FormSchema, currentStepIndex: number, inactiveElements: string[]): number {
    return this.stepDependConditionService.findPreviousStep(form, currentStepIndex, inactiveElements) ?? currentStepIndex;
  }

  isStepValidToDisplay(form: FormSchema, currentStepIndex: number, currentPageUrl: string, inactiveElements: string[]): boolean {
    return this.stepDependConditionService.isStepValidToDisplay(form, currentStepIndex, currentPageUrl, inactiveElements);
  }

  isMalFormSteps(form: FormSchema): boolean {
    return this.stepHelperService.isMalFormSteps(form);
  }

  saveDraft(form: FormSchema, formSubmissions: FormSubmission[]): void {
    this.formStorageService.saveFormDataToStorage(form, formSubmissions);
  }

  loadDraft(form: FormSchema): FormSubmission[] {
    return this.formStorageService.loadFormDataFromStorage(form);
  }

  clearNavigationState(form: FormSchema): void {
    this.formCacheService.remove(FormConstants.FormCurrentStep + form.key);
    this.formStorageService.removeFormDataInStorage(form);
  }

  goToStep(form: FormSchema, stepIndex: number, formSubmissions: FormSubmission[], history?: { push?: (path: string) => void }): void {
    this.saveDraft(form, formSubmissions);
    this.formCacheService.set<number>(FormConstants.FormCurrentStep + form.key, stepIndex);

    const attachedContentLink = form.steps[stepIndex]?.formStep.properties.attachedContentLink;
    if (!attachedContentLink) {
      return;
    }

    const targetPath = new URL(attachedContentLink, this.tempBaseUrl).pathname;
    if (!targetPath || targetPath === this.document.location?.pathname) {
      return;
    }

    if (history?.push) {
      history.push(targetPath);
      return;
    }

    void this.router.navigateByUrl(targetPath);
  }
}
