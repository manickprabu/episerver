import { FormSubmission } from './form-submission.model';

export interface FormSubmitModel {
  formKey: string;
  locale: string;
  submissionData: FormSubmission[];
  isFinalized: boolean;
  partialSubmissionKey: string;
  hostedPageUrl: string;
  accessToken?: string;
  currentStepIndex: number;
}

export interface FormSubmitMessage {
  section: string;
  message: string;
  identifier: string;
}

export interface FormSubmitResult {
  success: boolean;
  submissionKey: string;
  validationFail: boolean;
  messages: FormSubmitMessage[];
}
