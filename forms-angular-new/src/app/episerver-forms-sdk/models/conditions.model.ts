export interface Condition {
  field: string;
  operator: string;
  fieldValue: string;
}

export interface RuleConditionProperties {
  satisfiedAction: string;
  conditionCombination: string;
  conditions: Condition[];
}
