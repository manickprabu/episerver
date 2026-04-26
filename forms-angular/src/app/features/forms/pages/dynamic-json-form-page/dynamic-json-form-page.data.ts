import { DynamicEpiServerForm } from '../../../../core/models/dynamic-episerver-form.model';

export const SAMPLE_DYNAMIC_JSON_FORM: DynamicEpiServerForm = {
  formId: 31777,
  contentGuid: '0d8c62c0-3c6a-41e6-b5e4-ab4aa59b77c2',
  name: 'Instruct multi step',
  totalSteps: 1,
  fields: [
    {
      contentGuid: 'a8260288-aac9-4ab3-baec-978b7b342066',
      editViewFriendlyTitle: 'Text',
      type: 'TextboxElementBlockProxy',
      properties: {
        Label: 'Text',
        Validators: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
        ValidatorMessages: [
          {
            validator: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
            message: 'This field is required.'
          }
        ],
        Conditions: []
      }
    },
    {
      contentGuid: 'a8260288-aac9-4ab3-baec-978b7b342066dd',
      editViewFriendlyTitle: 'Text',
      type: 'TextboxElementBlockProxy',
      properties: {
        Label: 'Text sec',
        Validators: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
        ValidatorMessages: [
          {
            validator: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
            message: 'This field is required.'
          }
        ],
        Conditions: []
      }
    },
    {
      contentGuid: '83442699-7662-4591-8be2-24ad860b0521',
      editViewFriendlyTitle: 'Form step',
      type: 'FormStepBlockProxy',
      properties: {}
    },
    {
      contentGuid: 'e3b163f4-2627-423e-8f7f-cfa2286e3b55',
      editViewFriendlyTitle: 'Selection',
      type: 'SelectionElementBlockProxy',
      properties: {
        Label: 'Choose one Option',
        Validators: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
        Feed: 'FormsFeed_UseManualInput',
        Items: [
          { caption: 'First Element', value: 'First', checked: true },
          { caption: 'Second element', value: 'Second', checked: false },
          { caption: 'Third element', value: 'Second', checked: false }
        ],
        ValidatorMessages: [
          {
            validator: 'EPiServer.Forms.Implementation.Validation.RequiredValidator',
            message: 'This field is required.'
          }
        ],
        Conditions: []
      }
    },
    {
      contentGuid: '3eee7643-3d09-4a54-8935-00f260b82071',
      editViewFriendlyTitle: 'Multiple or single choice',
      type: 'ChoiceElementBlockProxy',
      properties: {
        Label: 'Multiple or single choice',
        Feed: 'FormsFeed_UseManualInput',
        Items: [
          { caption: 'Male', value: 'Male', checked: false },
          { caption: 'Female', value: 'Female', checked: false }
        ],
        Conditions: []
      }
    },
    {
      contentGuid: 'e7e30f95-e88b-4d3b-892e-73017eeb1092',
      editViewFriendlyTitle: 'Submit button',
      type: 'SubmitButtonElementBlockProxy',
      properties: { Label: 'Submit', Conditions: [] }
    }
  ],
  hidden: {
    __FormGuid: '0d8c62c0-3c6a-41e6-b5e4-ab4aa59b77c2',
    __FormSubmissionId: 'b7734d29-a6df-4afd-b5b5-ae2facd8478a'
  },
  antiforgery: {
    token:
      'CfDJ8NhyIcSBZZZJoQZgcz4Qd3ZcLxq-QEZ4cpPR5DcDGzn-vwK-s0HWhAj4Td83S2gMB2WSmcj2TzwtTeUBdRKXMcW2_xLrjqoZtoVMWz1RxAuQdi3R6-zCjzrilPxkzM1HRi9DBDKTMXho-4ipeNDbH0VXMJCLBJTRbVPsendncDKRmvXnt5K1damx2rjwUwxgUQ',
    headerName: 'RequestVerificationToken'
  }
};
