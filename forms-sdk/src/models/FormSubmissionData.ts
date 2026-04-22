export interface FormSubmissionData {
    FormKey: string;
    Locale: string;
    IsFinalized: boolean;
    SubmissionKey: string;
    HostedPageUrl: string;
    CurrentStep: number | string;
    Fields: FormFieldsData
}

export interface FormFieldsData {
    [key: string]: any
}