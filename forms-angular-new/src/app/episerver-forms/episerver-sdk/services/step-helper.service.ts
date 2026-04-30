import { Injectable } from '@angular/core';

import { FormContainer, FormValidationResult } from '../models';
import { equals, isNull, isNullOrEmpty } from '../utils';

@Injectable()
export class StepHelperService {
  private readonly tempBaseUrl = 'http://temp';

  isAllStepsAreNotLinked(form: FormContainer): boolean {
    return !form.steps.some((step) => !isNullOrEmpty(step.formStep.properties?.attachedContentLink));
  }

  isMalFormSteps(form: FormContainer): boolean {
    const totalStep = form.steps.length;

    if (totalStep >= 2 && !this.isAllStepsAreNotLinked(form)) {
      return form.steps.some((step) => isNullOrEmpty(step.formStep.properties?.attachedContentLink));
    }

    return false;
  }

  getCurrentStepIndex(form: FormContainer, currentPageUrl?: string): number {
    let currentStepIndex = 0;

    if (this.isAllStepsAreNotLinked(form)) {
      return currentStepIndex;
    }

    form.steps.every((step, index) => {
      const url = new URL(step.formStep.properties?.attachedContentLink ?? '/', this.tempBaseUrl);
      const pageUrl = new URL(currentPageUrl ?? '/', this.tempBaseUrl);

      if (equals(pageUrl.pathname, url.pathname)) {
        currentStepIndex = index;
        return false;
      }

      return true;
    });

    return currentStepIndex;
  }

  isInCurrentStep(form: FormContainer, elementKey: string, stepIndex: number): boolean {
    const currentStep = form.steps[stepIndex];
    return currentStep ? currentStep.elements.some((element) => equals(element.key, elementKey)) : true;
  }

  getFirstInvalidElement(
    form: FormContainer,
    formValidationResults: FormValidationResult[],
    stepIndex: number
  ): string {
    return (
      formValidationResults.filter(
        (validation) => !validation.result.valid && this.isInCurrentStep(form, validation.elementKey, stepIndex)
      )[0]?.elementKey ?? ''
    );
  }

  isNeedCheckDependCondition(form: FormContainer, stepIndex: number): boolean {
    const step = form.steps[stepIndex]?.formStep;
    if (isNull(step)) {
      return false;
    }

    return !isNullOrEmpty(step.properties?.dependField?.key);
  }

  getFirstInputElement(form: FormContainer, stepIndex: number, inactiveElements: string[]): string {
    const inputElement = form.steps[stepIndex]?.elements.find(
      (element) => element.contentType.indexOf('ElementBlock') > 0 && inactiveElements.indexOf(element.key) < 0
    );

    return inputElement?.key ?? '';
  }
}
