import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { FormNavigationService } from './form-navigation.service';
import { FormSchema } from '../models/form-schema.model';

const linkedStepForm: FormSchema = {
  key: 'linked-form',
  locale: 'en',
  properties: { title: 'Linked form', showNavigationBar: true },
  formElements: [
    {
      key: 'step-1',
      contentType: 'FormStepBlock',
      properties: { label: 'Step one', attachedContentLink: '/forms/steps/one' }
    },
    {
      key: 'firstName',
      contentType: 'TextboxElementBlock',
      properties: { label: 'First name' }
    },
    {
      key: 'step-2',
      contentType: 'FormStepBlock',
      properties: { label: 'Step two', attachedContentLink: '/forms/steps/two' }
    },
    {
      key: 'details',
      contentType: 'TextareaElementBlock',
      properties: { label: 'Details' }
    }
  ]
};

const delayedStepForm: FormSchema = {
  key: 'delayed-step-form',
  locale: 'en',
  properties: { title: 'Delayed step form', showNavigationBar: true },
  formElements: [
    {
      key: 'intro',
      contentType: 'TextboxElementBlock',
      properties: { label: 'Intro' }
    },
    {
      key: 'step-2',
      contentType: 'FormStepBlock',
      properties: { label: 'Step two' }
    },
    {
      key: 'details',
      contentType: 'TextareaElementBlock',
      properties: { label: 'Details' }
    }
  ]
};

describe('FormNavigationService', () => {
  let service: FormNavigationService;
  const navigateByUrl = vi.fn().mockResolvedValue(true);

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        FormNavigationService,
        {
          provide: Router,
          useValue: { navigateByUrl }
        },
        {
          provide: DOCUMENT,
          useValue: document
        }
      ]
    });

    service = TestBed.inject(FormNavigationService);
    navigateByUrl.mockClear();
  });

  it('resolves the initial step index from the current page url before cache', () => {
    localStorage.setItem('form_current_step_linked-form', '1');

    const index = service.resolveInitialStepIndex(linkedStepForm, 'https://app.example/forms/steps/one');

    expect(index).toBe(0);
  });

  it('persists step index and draft data, then navigates to the attached content route', () => {
    const formGroup = new FormGroup({
      firstName: new FormControl('Ada'),
      details: new FormControl('Parity')
    });

    service.goToStep(linkedStepForm, 1, formGroup);

    expect(localStorage.getItem('form_current_step_linked-form')).toBe('1');
    expect(sessionStorage.getItem('linked-form')).toContain('Ada');
    expect(navigateByUrl).toHaveBeenCalledWith('/forms/steps/two');
  });

  it('counts the implicit first step before a later FormStepBlock', () => {
    expect(service.findNextStep(delayedStepForm, 0)).toBe(1);
    expect(service.findPreviousStep(delayedStepForm, 1)).toBe(0);
  });
});
