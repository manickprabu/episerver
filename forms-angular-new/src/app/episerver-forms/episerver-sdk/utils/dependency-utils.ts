import { Condition, ElementDependencies, FormSubmission } from '../models';
import { equals } from './common-utils';

export function getConcatString(srcObject: unknown, separator: string): string {
  return srcObject instanceof Array ? srcObject.join(separator) : (srcObject as string);
}

export function getValueOfDependeeElement(
  condition: Condition,
  formSubmissions: FormSubmission[],
  elementDependencies: ElementDependencies[]
): unknown {
  let dependeeFieldValue = formSubmissions.filter((submission) => equals(submission.elementKey, condition.field))[0]
    ?.value;
  const dependeeElement = elementDependencies.find((element) => element.elementKey === condition.field);

  if (dependeeElement && !dependeeElement.isSatisfied) {
    dependeeFieldValue = undefined;
  }

  return dependeeFieldValue;
}
