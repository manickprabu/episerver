export const DEFAULT_ALLOWED_CONTENT_TYPES = [
  'TextboxElementBlock',
  'TextareaElementBlock',
  'NumberElementBlock',
  'RangeElementBlock',
  'UrlElementBlock',
  'ImageChoiceElementBlock',
  'SelectionElementBlock',
  'ChoiceElementBlock'
] as const;

export function getAllowedContentTypesInRichtext(
  allowedContentType?: string[],
  notAllowedContentType?: string[]
): string[] {
  const allowed = allowedContentType
    ? [...allowedContentType, ...DEFAULT_ALLOWED_CONTENT_TYPES]
    : [...DEFAULT_ALLOWED_CONTENT_TYPES];

  if (!notAllowedContentType?.length) {
    return allowed;
  }

  return allowed.filter((item) => !notAllowedContentType.includes(item));
}
