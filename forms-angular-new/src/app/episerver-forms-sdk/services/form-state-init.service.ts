import { Injectable } from '@angular/core';

import {
  ElementDependencies,
  FormConstants,
  FormContainer,
  FormState,
  FormSubmission,
  FormValidationResult,
  StepDependencies
} from '../models';
import { getDefaultValue, equals, isNullOrEmpty } from '../utils';
import { FormCacheService } from './form-cache.service';
import { FormStorageService } from './form-storage.service';
import { StepHelperService } from './step-helper.service';

@Injectable()
export class FormStateInitService {
  constructor(
    private readonly formStorageService: FormStorageService,
    private readonly formCacheService: FormCacheService,
    private readonly stepHelperService: StepHelperService
  ) {}

  initFormState(formContainer: FormContainer, currentPageUrl?: string, history?: unknown): FormState {
    const formData = this.formStorageService.loadFormDataFromStorage(formContainer);

    let formSubmissions: FormSubmission[] = [];
    let formValidationResults: FormValidationResult[] = [];
    let stepDependencies: StepDependencies[] = [];
    let elementDependencies: ElementDependencies[] = [];

    formContainer.steps?.forEach((step) => {
      step.elements.forEach((element) => {
        if (element.key !== step.formStep.key) {
          formValidationResults = formValidationResults.concat({
            elementKey: element.key,
            result: { valid: true, message: '' }
          });
          formSubmissions = formSubmissions.concat({
            elementKey: element.key,
            value: getDefaultValue(element)
          });
          elementDependencies = elementDependencies.concat({
            elementKey: element.key,
            isSatisfied: true,
            sastisfiedAction: (element.properties as { satisfiedAction?: string }).satisfiedAction
          });
        }
      });

      stepDependencies = stepDependencies.concat({ elementKey: step.formStep.key, isSatisfied: false });
    });

    if (formData.length > 0) {
      formSubmissions = formSubmissions.map((submission) => {
        const savedData = formData.find((item) => equals(item.elementKey, submission.elementKey));
        return savedData ?? submission;
      });
    }

    const stepIndexCached = this.formCacheService.get<string>(FormConstants.FormCurrentStep + formContainer.key);
    const currentStepIndex = isNullOrEmpty(stepIndexCached)
      ? this.stepHelperService.getCurrentStepIndex(formContainer, currentPageUrl)
      : parseInt(stepIndexCached!, 10);

    return {
      isReset: false,
      focusOn: '',
      dependencyInactiveElements: [],
      currentStepIndex,
      formSubmissions,
      formValidationResults,
      stepDependencies,
      formContainer,
      history,
      elementDependencies
    };
  }
}
