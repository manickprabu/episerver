export function isNull(value: unknown): boolean {
  return value === null || value === undefined;
}

export function isNullOrEmpty(value?: string): boolean {
  return isNull(value) || value === '';
}

export function equals(value1: string, value2: string, ignoreCase = false): boolean {
  return ignoreCase ? value1.toLowerCase() === value2.toLowerCase() : value1 === value2;
}

export function isMatchedReg(value: string, pattern: string): boolean {
  try {
    const rx = new RegExp(pattern);
    const matches = rx.exec(value);
    return matches !== null && matches.length > 0;
  } catch (error) {
    console.debug((error as Error).message);
    return false;
  }
}

export function isNumeric(value: unknown): boolean {
  return !isNaN(parseFloat(String(value))) && isFinite(Number(value));
}

export function isInArray(value: string, arrayString: string[], ignoreCase = false): boolean {
  if (ignoreCase) {
    value = value.toLowerCase();
    arrayString = arrayString.map((item) => item.toLowerCase());
  }

  return arrayString.indexOf(value) > -1;
}

export function htmlDecodeEntities(encodedString: string): string {
  if (typeof document === 'undefined') {
    return encodedString;
  }

  const textArea = document.createElement('textarea');
  textArea.innerHTML = encodedString;
  return textArea.value;
}

export function parseKeyToGuid(key: string): string {
  if (key.includes('-')) {
    return key;
  }

  const rxGetGuidGroups = /(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/;
  return key.replace(rxGetGuidGroups, '$1-$2-$3-$4-$5');
}
