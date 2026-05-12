export interface EpiserverContentLink {
  id: number;
  workID?: number;
  providerName?: string | null;
  getPublishedOrLatest?: boolean;
  isExternalProvider?: boolean;
  isReadOnly?: boolean;
}

export interface EpiserverFieldCondition {
  field?: EpiserverContentLink | null;
  operator?: number | string | null;
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
  contentLink?: EpiserverContentLink;
  contentGuid: string;
  editViewFriendlyTitle?: string;
  type: string;
  properties: EpiserverFieldProperties;
}

export interface EpiserverAntiforgery {
  token: string;
  headerName: string;
}

export interface EpiserverFormDefinition {
  formId: number | string;
  contentGuid: string;
  name: string;
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
