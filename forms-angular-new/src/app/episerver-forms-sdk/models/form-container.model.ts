import { ConditionProperties, FormElementBase } from './form-element.model';

export interface FormStepProperties extends ConditionProperties {
  [key: string]: unknown;
}

export interface FormStep {
  key: string;
  contentType: string;
  displayName: string;
  properties: FormStepProperties;
  localizations: Record<string, string>;
  locale: string;
}

export interface Step {
  formStep: FormStep;
  elements: FormElementBase[];
}

export interface FormContainerProperties {
  title: string;
  allowToStoreSubmissionData: boolean;
  showSummarizedData: boolean;
  confirmationMessage: string;
  resetConfirmationMessage: string;
  redirectToPage: string;
  submitSuccessMessage: string;
  allowAnonymousSubmission: boolean;
  allowMultipleSubmission: boolean;
  showNavigationBar: boolean;
  description: string;
  metadataAttribute: string;
  focusOnForm: boolean;
}

export interface FormContainer {
  key: string;
  properties: FormContainerProperties;
  formElements: FormElementBase[];
  steps: Step[];
  localizations: Record<string, string>;
  locale: string;
}
