import { Injectable } from '@angular/core';

import { FormContainer } from '../models';
import { equals, isInArray, isNullOrEmpty } from '../utils';
import { ConditionFunctionsService } from './condition-functions.service';
import { FormStorageService } from './form-storage.service';
import { StepHelperService } from './step-helper.service';

@Injectable()
export class StepDependConditionService {
  private readonly tempBaseUrl = 'http://temp';

  constructor(
    private readonly conditionFunctionsService: ConditionFunctionsService,
    private readonly formStorageService: FormStorageService,
    private readonly stepHelperService: StepHelperService
  ) {}

  isSatisfied(form: FormContainer, stepIndex: number, inactiveElements: string[]): boolean {
    const step = form.steps[stepIndex]?.formStep;

    if (!step) {
      return false;
    }

    const dependField = step.properties?.dependField;
    const storedData = this.formStorageService
      .loadFormDataFromStorage(form)
      .find((submission) => submission.elementKey === dependField?.key);
    const conditionFunction = this.conditionFunctionsService.get(
      String(step.properties?.['dependCondition'] ?? '')
    );

    if (!dependField || !conditionFunction || !storedData) {
      return true;
    }

    if (!dependField && isInArray(String(dependField), inactiveElements)) {
      return conditionFunction(null, String(step.properties['dependValue'] ?? ''));
    }

    return conditionFunction(storedData.value, String(step.properties['dependValue'] ?? ''));
  }

  findNextStep(form: FormContainer, currentStepIndex: number, inactiveElements: string[]): number | undefined {
    const nextStepIndex = currentStepIndex + 1;
    const nextStep = form.steps[nextStepIndex];

    if (nextStep) {
      return this.isSatisfied(form, nextStepIndex, inactiveElements)
        ? nextStepIndex
        : this.findNextStep(form, nextStepIndex, inactiveElements);
    }

    return form.steps.length - 1;
  }

  findPreviousStep(form: FormContainer, currentStepIndex: number, inactiveElements: string[]): number | undefined {
    const prevStepIndex = currentStepIndex - 1;
    const prevStep = form.steps[prevStepIndex];

    if (prevStep) {
      return this.isSatisfied(form, prevStepIndex, inactiveElements)
        ? prevStepIndex
        : this.findPreviousStep(form, prevStepIndex, inactiveElements);
    }

    return undefined;
  }

  isStepValidToDisplay(
    form: FormContainer,
    stepIndex: number,
    currentPageUrl: string,
    inactiveElements: string[]
  ): boolean {
    const totalStep = form.steps.length;
    if (stepIndex < 0 || stepIndex >= totalStep) {
      return false;
    }

    const step = form.steps[stepIndex].formStep;
    const attachedContent = step.properties?.attachedContentLink;
    const attachedContentUrl = new URL(String(attachedContent ?? ''), this.tempBaseUrl);
    const pageUrl = new URL(currentPageUrl, this.tempBaseUrl);

    if (!isNullOrEmpty(String(attachedContent ?? '')) && !equals(attachedContentUrl.pathname, pageUrl.pathname)) {
      return false;
    }

    if (stepIndex === totalStep - 1) {
      return true;
    }

    if (!this.stepHelperService.isNeedCheckDependCondition(form, stepIndex)) {
      return true;
    }

    const submissionData = this.formStorageService.loadFormDataFromStorage(form);
    if (submissionData.length === 0) {
      return false;
    }

    const inactiveStepsIndex = this.getInactiveStepsIndex(form, inactiveElements);
    return !inactiveStepsIndex.some((index) => index === stepIndex);
  }

  getInactiveStepsIndex(form: FormContainer, inactiveElements: string[]): number[] {
    if (form.steps.length === 1) {
      return [];
    }

    let inactiveSteps: number[] = [];

    form.steps.forEach((_, index) => {
      if (this.stepHelperService.isNeedCheckDependCondition(form, index) && !this.isSatisfied(form, index, inactiveElements)) {
        inactiveSteps = inactiveSteps.concat(index);
      }
    });

    return inactiveSteps;
  }
}
