import { describe, expect, it } from 'vitest';

import { getConcatString, getValueOfDependeeElement } from './dependency-utils';

describe('dependency-utils', () => {
  it('joins array values into a string', () => {
    expect(getConcatString(['A', 'B'], ',')).toBe('A,B');
  });

  it('returns undefined for inactive dependee elements', () => {
    expect(
      getValueOfDependeeElement(
        { field: 'country', operator: 'Equals', fieldValue: 'UK' },
        [{ elementKey: 'country', value: 'UK' }],
        [{ elementKey: 'country', isSatisfied: false }]
      )
    ).toBeUndefined();
  });
});
