export interface ElementValidationResult {
  valid: boolean;
  message: string;
}

export interface FormValidationResult {
  elementKey: string;
  result: ElementValidationResult;
}
