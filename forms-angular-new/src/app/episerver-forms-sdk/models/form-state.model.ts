import { FormContainer } from './form-container.model';
import { ElementDependencies, StepDependencies } from './form-dependencies.model';
import { IdentityInfo } from './identity-info.model';
import { FormSubmission } from './form-submission.model';
import { FormValidationResult } from './form-validation.model';

export interface FormState {
  isReset: boolean;
  formSubmissions: FormSubmission[];
  formValidationResults: FormValidationResult[];
  stepDependencies: StepDependencies[];
  elementDependencies: ElementDependencies[];
  formContainer: FormContainer;
  dependencyInactiveElements: string[];
  focusOn: string;
  identityInfo?: IdentityInfo;
  submissionKey?: string;
  currentStepIndex: number;
  isSubmitting?: boolean;
  history?: unknown;
}
