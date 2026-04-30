import { describe, expect, it } from 'vitest';

import { extractParams } from './url-utils';

describe('extractParams', () => {
  it('defaults search routes to /en', () => {
    expect(extractParams('/search')).toEqual({
      relativePath: '/en',
      locales: 'en',
      language: 'en',
      contentId: undefined,
      workId: undefined
    });
  });

  it('extracts content and work ids from CMS urls', () => {
    expect(extractParams('/EPiServer/CMS/Content/en/page,_,123_456/')).toEqual({
      relativePath: '/en/page',
      locales: 'en',
      language: 'en',
      contentId: 123,
      workId: 456
    });
  });
});
