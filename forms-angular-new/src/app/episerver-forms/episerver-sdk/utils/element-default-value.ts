import {
  DataElementBlockBaseProperties,
  FormElementBase,
  RangeProperties,
  SelectionProperties
} from '../models';
import { isNull, isNullOrEmpty, isNumeric } from './common-utils';

export function getDefaultValue(element: FormElementBase): string | number | undefined {
  const dataProps = element.properties as DataElementBlockBaseProperties;
  const autoFillData = dataProps?.forms_ExternalSystemsFieldMappings ?? [];
  let defaultValue: string | number | undefined = !isNullOrEmpty(dataProps?.predefinedValue)
    ? dataProps.predefinedValue
    : autoFillData.length > 0
      ? autoFillData[0]
      : undefined;

  const selectionProps = element.properties as SelectionProperties;
  if (!isNull(selectionProps?.items)) {
    const selectedArr: string[] = [];
    selectionProps.items?.forEach((item) => item.checked && selectedArr.push(item.value));

    if (selectedArr.length > 0) {
      defaultValue = selectedArr.join(',');
    }
  }

  const rangeProps = element.properties as RangeProperties;
  if (!isNull(rangeProps?.min)) {
    if (isNullOrEmpty(typeof defaultValue === 'number' ? String(defaultValue) : defaultValue) || !isNumeric(defaultValue)) {
      defaultValue = rangeProps.min;
    } else {
      const rangeValue = parseInt(String(defaultValue), 10);
      defaultValue =
        rangeValue > (rangeProps.max ?? rangeValue) || rangeValue < rangeProps.min!
          ? rangeProps.min
          : rangeValue;
    }
  }

  return defaultValue;
}
