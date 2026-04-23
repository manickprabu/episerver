import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { FormField } from '../../../../core/models/form-schema.model';
import { FormSchemaFormService } from '../../../../core/services/form-schema-form.service';

@Component({
  selector: 'app-validation-message',
  standalone: true,
  templateUrl: './validation-message.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidationMessageComponent {
  private readonly formSchemaFormService = inject(FormSchemaFormService);

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
