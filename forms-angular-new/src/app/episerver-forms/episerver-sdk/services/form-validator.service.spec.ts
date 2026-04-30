import { TestBed } from '@angular/core/testing';

import { FormElementBase, ValidatorType } from '../models';
import { FormValidatorService } from './form-validator.service';

const requiredElement: FormElementBase = {
  key: 'name',
  contentType: 'TextboxElementBlock',
  displayName: 'Name',
  properties: {
    description: '',
    label: 'Name',
    validators: [
      {
        type: ValidatorType.RequiredValidator,
        validationOrder: 1,
        description: 'Required',
        model: {
          message: 'This field is required.',
          validationCssClass: '',
          additionalAttributes: null
        }
      }
    ]
  },
  localizations: {},
  locale: 'en'
};

describe('FormValidatorService', () => {
  let service: FormValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [FormValidatorService] });
    service = TestBed.inject(FormValidatorService);
  });

  it('fails required validation for blank values', () => {
    expect(service.validate(requiredElement, '   ')).toEqual({
      valid: false,
      message: 'This field is required.'
    });
  });

  it('passes required validation for populated values', () => {
    expect(service.validate(requiredElement, 'Ada')).toEqual({ valid: true, message: '' });
  });

  it('validates numeric values', () => {
    expect(service.validateNumeric('42')).toBe(true);
    expect(service.validateNumeric('fourty-two')).toBe(false);
  });
});
