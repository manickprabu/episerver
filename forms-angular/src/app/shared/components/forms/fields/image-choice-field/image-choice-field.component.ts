import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormField } from '../../../../../core/models/form-schema.model';
import { FormSchemaFormService } from '../../../../../core/services/form-schema-form.service';
import { ValidationMessageComponent } from '../../validation-message/validation-message.component';

@Component({
  selector: 'app-image-choice-field',
  standalone: true,
  imports: [ReactiveFormsModule, ValidationMessageComponent],
  templateUrl: './image-choice-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageChoiceFieldComponent {
  private readonly formSchemaFormService = inject(FormSchemaFormService);
  readonly field = input.required<FormField>();
  readonly formGroup = input.required<FormGroup>();
  readonly submitted = input(false);
  protected readonly control = computed(() => this.formSchemaFormService.controlFor(this.formGroup(), this.field()));

  protected isChecked(value?: string): boolean {
    const currentValue = this.control()?.value;
    if (this.field().properties.allowMultiSelect) {
      return Array.isArray(currentValue) && currentValue.includes(value);
    }
    return currentValue === value;
  }

  protected toggleValue(value?: string, checked?: boolean): void {
    const control = this.control();
    if (!control || !value) {
      return;
    }

    if (this.field().properties.allowMultiSelect) {
      const current = Array.isArray(control.value) ? [...control.value] : [];
      const next = checked
        ? [...current, value].filter((item, index, array) => array.indexOf(item) === index)
        : current.filter((item) => item !== value);
      control.setValue(next);
      control.markAsTouched();
      return;
    }

    control.setValue(value);
    control.markAsTouched();
  }
}
