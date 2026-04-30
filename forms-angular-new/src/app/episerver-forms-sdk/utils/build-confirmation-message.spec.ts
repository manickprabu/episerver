import { describe, expect, it } from 'vitest';

import { FormContainer, FormSubmission } from '../models';
import { getConfirmationData, getStringValue } from './build-confirmation-message';

const form: FormContainer = {
  key: 'demo',
  properties: {
    title: 'Demo',
    allowToStoreSubmissionData: true,
    showSummarizedData: false,
    confirmationMessage: '',
    resetConfirmationMessage: '',
    redirectToPage: '',
    submitSuccessMessage: '',
    allowAnonymousSubmission: true,
    allowMultipleSubmission: true,
    showNavigationBar: true,
    description: '',
    metadataAttribute: '',
    focusOnForm: false
  },
  formElements: [],
  steps: [
    {
      formStep: {
        key: 'step-1',
        contentType: 'FormStepBlock',
        displayName: 'Step 1',
        properties: {},
        localizations: {},
        locale: 'en'
      },
      elements: [
        {
          key: 'name',
          contentType: 'TextboxElementBlock',
          displayName: 'Name',
          properties: { description: '', label: 'Name' },
          localizations: {},
          locale: 'en'
        }
      ]
    }
  ],
  localizations: {},
  locale: 'en'
};

describe('build-confirmation-message', () => {
  it('formats uploaded file names', () => {
    const submission: FormSubmission = {
      elementKey: 'file',
      value: [{ name: 'a.txt' }, { name: 'b.txt' }]
    };

    expect(getStringValue(submission)).toBe('a.txt | b.txt');
  });

  it('builds a summary for visible fields', () => {
    expect(
      getConfirmationData([{ elementKey: 'name', value: 'Ada' }], form, 0, [])
    ).toBe('Name: Ada\n');
  });
});
