export interface EpiserverContentLink {
  id: number;
  workID?: number;
  providerName?: string | null;
  getPublishedOrLatest?: boolean;
  isExternalProvider?: boolean;
  isReadOnly?: boolean;
}

export enum EpiserverConditionOperator {
  Contains = 0,
  NotContains = 1,
  Equals = 2,
  NotEquals = 3,
  MatchRegularExpression = 4
}

export enum EpiserverFieldType {
  TextboxElementBlockProxy = 'TextboxElementBlockProxy',
  TextareaElementBlockProxy = 'TextareaElementBlockProxy',
  SelectionElementBlockProxy = 'SelectionElementBlockProxy',
  ChoiceElementBlockProxy = 'ChoiceElementBlockProxy',
  FileUploadElementBlockProxy = 'FileUploadElementBlockProxy',
  PredefinedHiddenElementBlockProxy = 'PredefinedHiddenElementBlockProxy',
  FormStepBlockProxy = 'FormStepBlockProxy',
  NumberElementBlockProxy = 'NumberElementBlockProxy',
  RangeElementBlockProxy = 'RangeElementBlockProxy',
  SubmitButtonElementBlockProxy = 'SubmitButtonElementBlockProxy',
  ResetButtonElementBlockProxy = 'ResetButtonElementBlockProxy',
  ParagraphTextElementBlockProxy = 'ParagraphTextElementBlockProxy',
  ImageChoiceElementBlockProxy = 'ImageChoiceElementBlockProxy',
  UrlElementBlockProxy = 'UrlElementBlockProxy'
}

export interface EpiserverFieldCondition {
  field?: EpiserverContentLink | null;
  operator?: EpiserverConditionOperator | number | string | null;
  fieldValue?: string | null;
}

export interface EpiserverValidatorMessage {
  validator: string;
  message: string;
}

export interface EpiserverFieldItem {
  caption: string;
  value: string;
  checked?: boolean;
}

export interface EpiserverFieldProperties {
  Label?: string;
  Description?: string;
  PlaceHolder?: string;
  AutoComplete?: string;
  DefaultValue?: unknown;
  ParagraphText?: string;
  Feed?: string;
  Items?: EpiserverFieldItem[];
  Validators?: string;
  ValidatorMessages?: EpiserverValidatorMessage[];
  AllowMultiSelect?: boolean;
  AllowMultiple?: boolean;
  FinalizeForm?: boolean;
  RedirectToPage?: string;
  AttachedContentLink?: string;
  Conditions?: EpiserverFieldCondition[];
  ConditionCombination?: number | string;
  SatisfiedAction?: string;
  PredefinedValue?: string;
  [key: string]: unknown;
}

export interface EpiserverFieldDefinition {
  name?: string;
  id?: number;
  contentLink?: EpiserverContentLink;
  contentGuid: string;
  editViewFriendlyTitle?: string;
  type: EpiserverFieldType | string;
  value?: unknown;
  properties: EpiserverFieldProperties;
}

export interface EpiserverAntiforgery {
  token: string;
  headerName: string;
}

export interface EpiserverFormDefinition {
  formId?: number | string;
  formGuid?: string;
  submissionId?: string;
  contentGuid: string;
  name: string;
  title?: string;
  description?: string;
  totalSteps?: number;
  fields: EpiserverFieldDefinition[];
  hidden?: Record<string, string>;
  antiforgery?: EpiserverAntiforgery;
}

export interface FieldDependencyEvaluation {
  dependentFieldId: number;
  dependentFieldName: string;
  sourceFieldId: number;
  sourceFieldName: string;
  selectedValue: unknown;
  expectedValue: string;
  visible: boolean;
}

export interface FieldVisibilityState {
  visibilityByGuid: Record<string, boolean>;
  visibilityByContentLinkId: Record<number, boolean>;
  evaluations: FieldDependencyEvaluation[];
}
