import { describe, expect, it } from 'vitest';

import { htmlDecodeEntities, parseKeyToGuid } from './common-utils';

describe('common-utils extras', () => {
  it('parses compact keys into guid format', () => {
    expect(parseKeyToGuid('123456781234123412341234567890ab')).toBe(
      '12345678-1234-1234-1234-1234567890ab'
    );
  });

  it('decodes html entities', () => {
    expect(htmlDecodeEntities('&lt;strong&gt;Hello&lt;/strong&gt;')).toBe('<strong>Hello</strong>');
  });
});
