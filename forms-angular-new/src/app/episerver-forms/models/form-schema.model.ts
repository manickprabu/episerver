import type { AnyFormElementProperties, FeedItem, FormContainer, FormContainerProperties, FormElementBase, Step } from '../../episerver-forms/episerver-sdk';
import { ElementValidatorBase, FormSubmitModel, FormSubmitResult, FormValidationResult, IdentityInfo, ProblemDetail, ValidatorType } from '../../episerver-forms/episerver-sdk';

export type { IdentityInfo, FormSubmission, FormValidationResult, FormSubmitModel } from '../../episerver-forms/episerver-sdk';
export { ValidatorType };

export interface FormFieldOption extends FeedItem {
  text?: string;
  title?: string;
  url?: string;
}

export type FormFieldValidator = ElementValidatorBase;

export type FormFieldValidatorModel = ElementValidatorBase['model'] & {
  pattern?: string;
  allowedExtensions?: string[];
  maxSize?: number;
};

export type FormFieldProperties = AnyFormElementProperties &
  Record<string, unknown> & {
    label: string;
    description: string;
    placeHolder?: string;
    autoComplete?: string;
    predefinedValue?: unknown;
    defaultValue?: unknown;
    readOnly?: boolean;
    disabled?: boolean;
    paragraphText?: string;
    disablePlaceholdersReplacement?: boolean;
    showSelectionInputControl?: boolean;
    allowMultiSelect?: boolean;
    allowMultiple?: boolean;
    fileSize?: number;
    fileTypes?: string;
    min?: number | string;
    max?: number | string;
    step?: number;
    image?: string;
    items?: FormFieldOption[];
    forms_ExternalSystemsFieldMappings?: string[];
    redirectToPage?: string;
    finalizeForm?: boolean;
    attachedContentLink?: string;
    validators?: FormFieldValidator[];
  };

export type FormField = FormElementBase & {
  properties: FormFieldProperties;
};

export interface FormUploadedFile {
  name?: string;
  size?: number;
  url?: string;
  assetGuid?: string;
  file?: File;
}

export type FormSchemaProperties = FormContainerProperties;

export type FormStep = Step & {
  elements: FormField[];
};

export type FormSchema = FormContainer & {
  formElements: FormField[];
  steps: FormStep[];
};

export type FormSubmissionResult = FormSubmitResult;
export type FormServerValidationError = ProblemDetail;
