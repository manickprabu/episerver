import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { FormField } from '../../../models/form-schema.model';
import { FormSchemaFormService } from '../../../services/form-schema-form.service';

@Component({
  selector: 'lib-validation-message',
  standalone: false,
  templateUrl: './validation-message.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidationMessageComponent {
  
  constructor(private readonly formSchemaFormService: FormSchemaFormService) {}

  readonly field = input.required<FormField>();
  readonly control = input<AbstractControl | null>(null);
  readonly submitted = input(false);

  protected readonly message = computed(() => {
    const control = this.control();
    if (!control || !(control.touched || this.submitted()) || !control.invalid) {
      return '';
    }

    return this.formSchemaFormService.getValidationMessage(this.field(), control);
  });
}
