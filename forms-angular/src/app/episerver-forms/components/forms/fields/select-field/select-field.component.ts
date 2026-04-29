import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormField } from '../../../../models/form-schema.model';
import { FormSchemaFormService } from '../../../../services/form-schema-form.service';
import { ValidationMessageComponent } from '../../validation-message/validation-message.component';

@Component({
  selector: 'lib-select-field',
  standalone: false,
  templateUrl: './select-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectFieldComponent {
  constructor(private readonly formSchemaFormService: FormSchemaFormService) {}

  readonly field = input.required<FormField>();
  readonly formGroup = input.required<FormGroup>();
  readonly submitted = input(false);
  protected readonly control = computed(() => this.formSchemaFormService.controlFor(this.formGroup(), this.field()));

  protected onMultiSelectChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = Array.from(select.selectedOptions).map((option) => option.value);
    const control = this.control();
    control?.setValue(value);
    control?.markAsTouched();
  }

  protected onSingleSelectChange(value: string): void {
    const control = this.control();
    control?.setValue(value);
    control?.markAsTouched();
  }
}
