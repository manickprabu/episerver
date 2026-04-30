import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ALLOWED_CONTENT_TYPES,
  getAllowedContentTypesInRichtext
} from './get-allowed-content-types-in-richtext';

describe('getAllowedContentTypesInRichtext', () => {
  it('returns the default content types when no overrides are provided', () => {
    expect(getAllowedContentTypesInRichtext()).toEqual([...DEFAULT_ALLOWED_CONTENT_TYPES]);
  });

  it('prepends custom allowed content types', () => {
    expect(getAllowedContentTypesInRichtext(['CustomBlock'])).toEqual([
      'CustomBlock',
      ...DEFAULT_ALLOWED_CONTENT_TYPES
    ]);
  });

  it('filters out blocked content types', () => {
    expect(getAllowedContentTypesInRichtext(undefined, ['ChoiceElementBlock'])).not.toContain(
      'ChoiceElementBlock'
    );
  });
});
