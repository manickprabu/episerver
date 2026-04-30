export interface FormFieldsData {
  [key: string]: unknown;
}

export interface FormSubmissionData {
  FormKey: string;
  Locale: string;
  IsFinalized: boolean;
  SubmissionKey: string;
  HostedPageUrl: string;
  CurrentStep: number | string;
  Fields: FormFieldsData;
}
