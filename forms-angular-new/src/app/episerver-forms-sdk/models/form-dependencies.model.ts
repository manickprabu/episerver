export interface ElementDependencies {
  elementKey: string;
  isSatisfied: boolean;
  sastisfiedAction?: string;
}

export interface StepDependencies {
  elementKey: string;
  isSatisfied: boolean;
}
