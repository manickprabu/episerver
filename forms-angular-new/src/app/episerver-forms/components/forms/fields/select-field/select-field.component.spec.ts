import '@angular/compiler';
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NgSelectModule, NgSelectComponent } from '@ng-select/ng-select';

import { FormField } from '../../../../models/form-schema.model';
import { FormSchemaFormService } from '../../../../services/form-schema-form.service';
import { SelectFieldComponent } from './select-field.component';

@Component({
  selector: 'lib-element-wrapper',
  template: '<ng-content />',
  standalone: false
})
class MockElementWrapperComponent {
  @Input() className = '';
  @Input() control: FormControl<unknown> | null = null;
  @Input() submitted = false;
}

@Component({
  selector: 'lib-element-caption',
  template: '',
  standalone: false
})
class MockElementCaptionComponent {
  @Input() field!: FormField;
  @Input() forId: string | null = null;
}

@Component({
  selector: 'lib-validation-message',
  template: '',
  standalone: false
})
class MockValidationMessageComponent {
  @Input() field!: FormField;
  @Input() control: FormControl<unknown> | null = null;
  @Input() submitted = false;
}

describe('SelectFieldComponent', () => {
  let fixture: ComponentFixture<SelectFieldComponent>;
  let component: SelectFieldComponent;
  let formGroup: FormGroup;
  let control: FormControl<string | null>;
  let field: FormField;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectFieldComponent, MockElementWrapperComponent, MockElementCaptionComponent, MockValidationMessageComponent],
      imports: [ReactiveFormsModule, NgSelectModule],
      providers: [
        {
          provide: FormSchemaFormService,
          useValue: {
            controlFor: (group: FormGroup, currentField: FormField) => group.get(currentField.key)
          }
        }
      ]
    }).compileComponents();

    control = new FormControl<string | null>('Leasehold', { validators: Validators.required });
    formGroup = new FormGroup({ tenure: control });
    field = {
      key: 'tenure',
      contentType: 'SelectionElementBlock',
      displayName: 'Tenure',
      localizations: { selectionDefaultPlaceholder: 'Select an option' },
      locale: 'en',
      properties: {
        label: 'Tenure',
        description: 'Choose tenure',
        items: [
          { caption: 'Freehold', value: 'Freehold', checked: false },
          { caption: 'Leasehold', value: 'Leasehold', checked: false },
          { caption: 'Share of freehold', value: 'Share of freehold', checked: false }
        ]
      }
    };

    fixture = TestBed.createComponent(SelectFieldComponent);
    component = fixture.componentInstance;
    component.field = field;
    component.formGroup = formGroup;
    component.submitted = false;
    fixture.detectChanges();
  });

  function getSelect(): NgSelectComponent {
    return fixture.debugElement.query(By.directive(NgSelectComponent)).componentInstance as NgSelectComponent;
  }

  function getSelectedValue(): unknown {
    return getSelect().selectedValues[0]?.value ?? null;
  }

  function getSelectedValues(): unknown[] {
    return getSelect().selectedValues.map(item => item?.value ?? item);
  }

  it('shows the initial preselected value', () => {
    expect(control.value).toBe('Leasehold');
    expect(getSelectedValue()).toBe('Leasehold');
  });

  it('falls back to resolving the control from formGroup and field', () => {
    expect((component as any).resolvedControl).toBe(control);
  });

  it('reflects patchValue from the parent form control', () => {
    control.patchValue('Share of freehold');
    fixture.detectChanges();

    expect(control.value).toBe('Share of freehold');
    expect(getSelectedValue()).toBe('Share of freehold');
  });

  it('reflects setValue from the parent form control', () => {
    control.setValue('Freehold');
    fixture.detectChanges();

    expect(control.value).toBe('Freehold');
    expect(getSelectedValue()).toBe('Freehold');
  });

  it('updates the parent form control when the user selects an option', () => {
    const select = getSelect();
    const option = select.itemsList.findItem('Freehold');
    select.toggleItem(option);
    fixture.detectChanges();

    expect(control.value).toBe('Freehold');
    expect(getSelectedValue()).toBe('Freehold');
  });

  it('reflects the disabled state from the parent form control', () => {
    control.disable();
    fixture.detectChanges();

    expect(getSelect().disabled()).toBe(true);
  });

  it('marks the control as touched on blur and preserves validation state', () => {
    control.setValue('');
    control.markAsUntouched();
    fixture.detectChanges();

    getSelect().blurEvent.emit({} as FocusEvent);
    fixture.detectChanges();

    expect(control.touched).toBe(true);
    expect(control.invalid).toBe(true);
    expect(control.hasError('required')).toBe(true);
  });

  it('uses the direct [control] input when provided', () => {
    const directControl = new FormControl<string | null>('Leasehold', { validators: Validators.required });
    const directFixture = TestBed.createComponent(SelectFieldComponent);
    const directComponent = directFixture.componentInstance;
    directComponent.field = field;
    directComponent.controlInput = directControl;
    directComponent.formGroup = null;
    directFixture.detectChanges();

    expect((directComponent as any).resolvedControl).toBe(directControl);

    directControl.setValue('Freehold');
    directFixture.detectChanges();

    const directSelect = directFixture.debugElement.query(By.directive(NgSelectComponent)).componentInstance as NgSelectComponent;
    expect(directSelect.selectedValues[0]?.value).toBe('Freehold');
  });

  it('binds array values for multi select fields', () => {
    const multiControl = new FormControl<string[] | null>(['Freehold']);
    const multiFixture = TestBed.createComponent(SelectFieldComponent);
    const multiComponent = multiFixture.componentInstance;
    multiComponent.field = {
      ...field,
      properties: {
        ...field.properties,
        allowMultiSelect: true
      }
    };
    multiComponent.controlInput = multiControl as unknown as FormControl<unknown>;
    multiFixture.detectChanges();

    const multiSelect = multiFixture.debugElement.query(By.directive(NgSelectComponent)).componentInstance as NgSelectComponent;

    expect(multiSelect.multiple()).toBe(true);
    expect(multiSelect.selectedValues.map(item => item?.value ?? item)).toEqual(['Freehold']);

    multiSelect.select({ value: 'Leasehold', caption: 'Leasehold' });
    multiFixture.detectChanges();

    expect(multiControl.value).toEqual(['Freehold', 'Leasehold']);
  });
});
