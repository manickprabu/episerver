import { FormContainer, FormElementBase, FormSubmission } from '../models';
import { isNullOrEmpty } from './common-utils';

export const FIELDS_TO_IGNORE = [
  'FormStepBlock',
  'SubmitButtonElementBlock',
  'PredefinedHiddenElementBlock',
  'ParagraphTextElementBlock'
];

export function getStringValue(element: FormSubmission): unknown {
  const value = element.value ?? '';

  if (Array.isArray(value) && value.length > 0 && value[0] !== null && typeof value[0] === 'object') {
    const fileList = value as Array<{ name: string }>;
    return fileList.map((file) => file.name).join(' | ');
  }

  return value;
}

export function getValidStepsElement(
  elementKey: string,
  form: FormContainer,
  currentStepIndex: number
): FormElementBase | null {
  let formElement: FormElementBase | null = null;

  for (let index = 0; index <= currentStepIndex; index += 1) {
    for (const element of form.steps[index].elements) {
      if (element.key === elementKey) {
        formElement = element;
        break;
      }
    }
  }

  return formElement;
}

export function getConfirmationData(
  data: FormSubmission[],
  form: FormContainer,
  currentStepIndex: number,
  inactiveElements: string[],
  fieldsToIgnore?: string[]
): string {
  let message = '';
  const ignoreFields = fieldsToIgnore ?? FIELDS_TO_IGNORE;

  data.forEach((elementData) => {
    const formElement = getValidStepsElement(elementData.elementKey, form, currentStepIndex);
    const value = getStringValue(elementData);

    if (
      formElement &&
      ignoreFields.indexOf(formElement.contentType) === -1 &&
      inactiveElements.indexOf(formElement.key) === -1 &&
      !isNullOrEmpty(String(value ?? ''))
    ) {
      message += `${formElement.displayName}: ${value}${'\n'}`;
    }
  });

  return message;
}
