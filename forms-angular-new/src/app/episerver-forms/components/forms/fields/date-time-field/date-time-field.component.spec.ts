import '@angular/compiler';
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { FormField } from '../../../../models/form-schema.model';
import { FormSchemaFormService } from '../../../../services/form-schema-form.service';
import { DateTimeFieldComponent } from './date-time-field.component';

@Component({ selector: 'lib-element-wrapper', template: '<ng-content />', standalone: false })
class MockElementWrapperComponent {
  @Input() className = '';
  @Input() control: FormControl<unknown> | null = null;
  @Input() submitted = false;
}

@Component({ selector: 'lib-element-caption', template: '', standalone: false })
class MockElementCaptionComponent {
  @Input() field!: FormField;
  @Input() forId: string | null = null;
}

@Component({ selector: 'lib-validation-message', template: '', standalone: false })
class MockValidationMessageComponent {
  @Input() field!: FormField;
  @Input() control: FormControl<unknown> | null = null;
  @Input() submitted = false;
}

@Component({ selector: 'lib-data-list', template: '', standalone: false })
class MockDataListComponent {
  @Input() field!: FormField;
}

describe('DateTimeFieldComponent', () => {
  let fixture: ComponentFixture<DateTimeFieldComponent>;
  let component: DateTimeFieldComponent;
  let control: FormControl<string | null>;
  let formGroup: FormGroup;
  let field: FormField;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DateTimeFieldComponent, MockElementWrapperComponent, MockElementCaptionComponent, MockValidationMessageComponent, MockDataListComponent],
      imports: [ReactiveFormsModule],
      providers: [
        {
          provide: FormSchemaFormService,
          useValue: {
            controlFor: (group: FormGroup, currentField: FormField) => group.get(currentField.key)
          }
        }
      ]
    }).compileComponents();

    control = new FormControl<string | null>('2026-05-19', { validators: Validators.required });
    formGroup = new FormGroup({ startDate: control });
    field = {
      key: 'startDate',
      contentType: 'DateTimeElementBlock',
      displayName: 'Start Date',
      localizations: {},
      locale: 'en',
      properties: {
        label: 'Start date',
        description: 'Choose a date',
        placeHolder: 'YYYY-MM-DD',
        autoComplete: 'bday',
        min: '2026-01-01',
        max: '2026-12-31',
        readOnly: false,
        validators: []
      }
    } as unknown as FormField;

    fixture = TestBed.createComponent(DateTimeFieldComponent);
    component = fixture.componentInstance;
    component.field = field;
    component.formGroup = formGroup;
    fixture.detectChanges();
  });

  function getInput(): HTMLInputElement {
    return fixture.debugElement.query(By.css('input[type="date"]')).nativeElement as HTMLInputElement;
  }

  it('renders the date control with the initial reactive form value', () => {
    const input = getInput();

    expect(input.value).toBe('2026-05-19');
    expect(input.getAttribute('min')).toBe('2026-01-01');
    expect(input.getAttribute('max')).toBe('2026-12-31');
    expect(input.getAttribute('placeholder')).toBe('YYYY-MM-DD');
  });

  it('updates when the parent form patches or sets the value', () => {
    control.patchValue('2026-06-15');
    fixture.detectChanges();
    expect(getInput().value).toBe('2026-06-15');

    control.setValue('2026-07-20');
    fixture.detectChanges();
    expect(getInput().value).toBe('2026-07-20');
  });

  it('updates the parent reactive form when the user changes the date', () => {
    const input = getInput();
    input.value = '2026-08-01';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(control.value).toBe('2026-08-01');
  });

  it('supports required validation and readonly or disabled state', () => {
    control.setValue('');
    control.markAsTouched();
    fixture.detectChanges();
    expect(control.hasError('required')).toBeTrue();

    field = {
      ...field,
      properties: {
        ...field.properties,
        readOnly: true
      }
    } as FormField;
    component.field = field;
    fixture.detectChanges();
    expect(getInput().readOnly).toBeTrue();

    control.disable();
    fixture.detectChanges();
    expect(getInput().disabled).toBeTrue();
  });
});
