import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormField } from '../../../../models/form-schema.model';
import { FormSchemaFormService } from '../../../../services/form-schema-form.service';

@Component({
  selector: 'lib-choice-field',
  standalone: false,
  templateUrl: './choice-field.component.html',
  styleUrls: ['./choice-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChoiceFieldComponent {
  constructor(private readonly formSchemaFormService: FormSchemaFormService) {}

  @Input() field!: FormField;
  @Input() formGroup!: FormGroup;
  @Input() submitted = false;

  protected get control() {
    return this.formSchemaFormService.controlFor(this.formGroup, this.field);
  }

  protected isChecked(value?: string): boolean {
    const currentValue = this.control?.value;
    if (this.field.properties.allowMultiSelect) {
      return Array.isArray(currentValue) && currentValue.includes(value);
    }
    return currentValue === value;
  }

  protected toggleValue(value?: string, checked?: boolean): void {
    const control = this.control;
    if (!control || control.disabled || !value) {
      return;
    }

    if (this.field.properties.allowMultiSelect) {
      const current = Array.isArray(control.value) ? [...control.value] : [];
      const next = checked ? [...current, value].filter((item, index, array) => array.indexOf(item) === index) : current.filter(item => item !== value);
      control.setValue(next);
      control.markAsTouched();
      return;
    }

    control.setValue(value);
    control.markAsTouched();
  }
}
