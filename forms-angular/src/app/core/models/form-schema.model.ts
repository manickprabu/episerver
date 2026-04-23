export interface IdentityInfo {
  username: string;
  accessToken: string;
}

export interface FormSchema {
  key: string;
  locale?: string;
  properties: FormSchemaProperties;
  localizations?: Record<string, string>;
  formElements: FormField[];
}

export interface FormSchemaProperties {
  title?: string;
  description?: string;
  submitSuccessMessage?: string;
  redirectToPage?: string;
  allowAnonymousSubmission?: boolean;
  showNavigationBar?: boolean;
  confirmationMessage?: string;
  showSummarizedData?: boolean;
  focusOnForm?: boolean;
  resetConfirmationMessage?: string;
}

export interface FormFieldOption {
  caption?: string;
  value?: string;
  text?: string;
  title?: string;
  url?: string;
  checked?: boolean;
}

export interface FormFieldValidatorModel {
  message?: string;
  pattern?: string;
  validationCssClass?: string;
  allowedExtensions?: string[];
  maxSize?: number;
}

export interface FormFieldValidator {
  type:
    | 'RequiredValidator'
    | 'EmailValidator'
    | 'RegularExpressionValidator'
    | 'UrlValidator'
    | 'IntegerValidator'
    | 'PositiveIntegerValidator'
    | 'NumericValidator'
    | 'AllowedExtensionsValidator'
    | 'MaxFileSizeValidator'
    | string;
  model: FormFieldValidatorModel;
}

export interface FormFieldBaseProperties {
  label?: string;
  description?: string;
  placeHolder?: string;
  autoComplete?: string;
  defaultValue?: unknown;
  paragraphText?: string;
  disablePlaceholdersReplacement?: boolean;
  showSelectionInputControl?: boolean;
  allowMultiSelect?: boolean;
  allowMultiple?: boolean;
  fileTypes?: string;
  min?: number;
  max?: number;
  step?: number;
  image?: string;
  items?: FormFieldOption[];
  forms_ExternalSystemsFieldMappings?: string[];
  redirectToPage?: string;
  finalizeForm?: boolean;
  attachedContentLink?: string;
  validators?: FormFieldValidator[];
  [key: string]: unknown;
}

export interface FormFieldBase {
  key: string;
  contentType: FormFieldContentType;
  displayName?: string;
  locale?: string;
  localizations?: Record<string, string>;
  properties: FormFieldBaseProperties;
}

export type FormFieldContentType =
  | 'TextboxElementBlock'
  | 'TextareaElementBlock'
  | 'NumberElementBlock'
  | 'PredefinedHiddenElementBlock'
  | 'ChoiceElementBlock'
  | 'RangeElementBlock'
  | 'FormStepBlock'
  | 'SelectionElementBlock'
  | 'UrlElementBlock'
  | 'ImageChoiceElementBlock'
  | 'FileUploadElementBlock'
  | 'ResetButtonElementBlock'
  | 'SubmitButtonElementBlock'
  | 'ParagraphTextElementBlock'
  | string;

export type FormField = FormFieldBase;

export interface FormStep {
  formStep: FormFieldBase;
  elements: FormField[];
}

export interface FormSubmissionData {
  formKey: string;
  locale?: string;
  fields: Record<string, unknown>;
  isFinalized: boolean;
  hostedPageUrl?: string;
  currentStepIndex: number;
  accessToken?: string;
  submissionKey?: string;
}

export interface FormSubmissionResult {
  success: boolean;
  submissionKey?: string;
  validationFail?: boolean;
  messages?: Array<{
    section?: string;
    message: string;
    identifier?: string;
  }>;
}

export interface FormServerValidationError {
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
}
