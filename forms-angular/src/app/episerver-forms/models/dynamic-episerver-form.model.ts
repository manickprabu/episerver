export interface DynamicEpiServerValidatorMessage {
  validator: string;
  message: string;
}

export interface DynamicEpiServerFieldItem {
  caption: string;
  value: string;
  checked?: boolean;
}

export interface DynamicEpiServerFieldProperties {
  Label?: string;
  Description?: string;
  PlaceHolder?: string;
  AutoComplete?: string;
  DefaultValue?: unknown;
  ParagraphText?: string;
  Feed?: string;
  Items?: DynamicEpiServerFieldItem[];
  Validators?: string;
  ValidatorMessages?: DynamicEpiServerValidatorMessage[];
  AllowMultiSelect?: boolean;
  AllowMultiple?: boolean;
  FinalizeForm?: boolean;
  RedirectToPage?: string;
  AttachedContentLink?: string;
  Conditions?: unknown[];
  [key: string]: unknown;
}

export interface DynamicEpiServerField {
  contentGuid: string;
  editViewFriendlyTitle?: string;
  type: string;
  properties: DynamicEpiServerFieldProperties;
}

export interface DynamicEpiServerAntiforgery {
  token: string;
  headerName: string;
}

export interface DynamicEpiServerForm {
  formId: number;
  contentGuid: string;
  name: string;
  totalSteps?: number;
  fields: DynamicEpiServerField[];
  hidden?: Record<string, string>;
  antiforgery?: DynamicEpiServerAntiforgery;
}
