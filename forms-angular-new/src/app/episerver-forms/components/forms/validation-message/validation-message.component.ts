import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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

  @Input() field!: FormField;
  @Input() control: AbstractControl | null = null;
  @Input() submitted = false;

  protected get message(): string {
    const control = this.control;
    if (!control || !(control.touched || this.submitted) || !control.invalid) {
      return '';
    }

    return this.formSchemaFormService.getValidationMessage(this.field, control);
  }
}
