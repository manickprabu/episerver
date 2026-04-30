import { Injectable } from '@angular/core';

import { FormContainer, FormElementBase, FormStep, Step } from '../models';
import { equals, newUniqueId } from '../utils';

@Injectable()
export class StepBuilderService {
  buildForm(form: FormContainer): FormContainer {
    const steps: Step[] = [];
    let elements: FormElementBase[] = [];
    let currentStep = { key: newUniqueId() } as FormStep;

    form.formElements.forEach((element, index) => {
      if (this.isFormStep(element)) {
        if (index !== 0) {
          steps.push({ formStep: { ...currentStep }, elements: [...elements] });
        }

        elements = [];
        currentStep = { ...(element as unknown as FormStep) };
      }

      elements.push(element);
    });

    steps.push({ formStep: { ...currentStep }, elements: [...elements] });

    return {
      ...form,
      steps
    };
  }

  isFormStep(element: FormElementBase): boolean {
    return equals(element.contentType, 'FormStepBlock');
  }
}
