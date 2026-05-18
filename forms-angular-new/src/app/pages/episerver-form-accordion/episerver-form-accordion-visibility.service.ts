import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EpiserverFormAccordionVisibilityService {
  isStepOpen(currentStepIndex: number, stepIndex: number): boolean {
    return currentStepIndex === stepIndex;
  }

  isStepAccessible(_stepIndex: number): boolean {
    return true;
  }
}
