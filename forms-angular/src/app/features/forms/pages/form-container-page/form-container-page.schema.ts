import { FormSchema } from '../../../../episerver-forms/models/form-schema.model';

export const sampleSupportRequestForm: FormSchema = {
  key: 'support-request',
  locale: 'en',
  properties: {
    title: 'Support request',
    description: 'A two-step Angular migration of the React FormContainerBlock surface.',
    submitSuccessMessage: '<strong>Thanks.</strong> Your request has been sent.',
    allowAnonymousSubmission: true,
    showNavigationBar: true
  },
  localizations: {
    previousButtonLabel: 'Previous',
    nextButtonLabel: 'Next',
    pageButtonLabel: 'Page'
  },
  formElements: [
    {
      key: 'support-step-1',
      contentType: 'FormStepBlock',
      properties: {
        label: 'About you',
        description: 'Tell us who should receive the reply.'
      },
      localizations: {
        previousButtonLabel: 'Previous',
        nextButtonLabel: 'Next',
        pageButtonLabel: 'Page'
      }
    },
    {
      key: 'firstName',
      contentType: 'TextboxElementBlock',
      properties: {
        label: 'First name',
        placeHolder: 'Ada',
        autoComplete: 'given-name',
        validators: [
          {
            type: 'RequiredValidator',
            model: {
              message: 'First name is required.'
            }
          }
        ]
      }
    },
    {
      key: 'emailAddress',
      contentType: 'TextboxElementBlock',
      properties: {
        label: 'Email address',
        placeHolder: 'ada@example.com',
        autoComplete: 'email',
        validators: [
          {
            type: 'RequiredValidator',
            model: {
              message: 'Email is required.'
            }
          },
          {
            type: 'EmailValidator',
            model: {
              message: 'Enter a valid email address.'
            }
          }
        ]
      }
    },
    {
      key: 'interests',
      contentType: 'ChoiceElementBlock',
      properties: {
        label: 'Topics',
        allowMultiSelect: true,
        items: [
          { caption: 'Migration planning', value: 'planning' },
          { caption: 'Validation parity', value: 'validation' },
          { caption: 'Submission payloads', value: 'payloads' }
        ]
      }
    },
    {
      key: 'contactReason',
      contentType: 'SelectionElementBlock',
      properties: {
        label: 'How can we help?',
        placeHolder: 'Choose one',
        items: [
          { caption: 'General question', value: 'question' },
          { caption: 'Bug report', value: 'bug' },
          { caption: 'Migration support', value: 'migration' }
        ],
        validators: [
          {
            type: 'RequiredValidator',
            model: {
              message: 'Choose a reason for contact.'
            }
          }
        ]
      }
    },
    {
      key: 'support-step-2',
      contentType: 'FormStepBlock',
      properties: {
        label: 'Request details',
        description: 'Share the context we should preserve from React.'
      },
      localizations: {
        previousButtonLabel: 'Previous',
        nextButtonLabel: 'Next',
        pageButtonLabel: 'Page'
      }
    },
    {
      key: 'details',
      contentType: 'TextareaElementBlock',
      properties: {
        label: 'Details',
        placeHolder: 'Describe your form and any expected thank-you behavior.',
        validators: [
          {
            type: 'RequiredValidator',
            model: {
              message: 'Details are required.'
            }
          }
        ]
      }
    },
    {
      key: 'website',
      contentType: 'UrlElementBlock',
      properties: {
        label: 'Reference URL',
        placeHolder: 'https://example.com/current-form',
        validators: [
          {
            type: 'UrlValidator',
            model: {
              message: 'Enter a valid URL.',
              pattern: 'https?://.+'
            }
          }
        ]
      }
    },
    {
      key: 'resetForm',
      contentType: 'ResetButtonElementBlock',
      properties: {
        label: 'Start over'
      }
    },
    {
      key: 'submitForm',
      contentType: 'SubmitButtonElementBlock',
      properties: {
        label: 'Send request',
        finalizeForm: true
      }
    }
  ]
};
