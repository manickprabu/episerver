import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { FormField } from '../../../../models/form-schema.model';
import { FormSchemaFormService } from '../../../../services/form-schema-form.service';

@Component({
  selector: 'lib-select-field',
  standalone: false,
  templateUrl: './select-field.component.html',
  styleUrls: ['./select-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectFieldComponent {
  constructor(private readonly formSchemaFormService: FormSchemaFormService) {}

  @Input() field!: FormField;
  @Input() formGroup: FormGroup | null = null;
  @Input('control') controlInput: FormControl<unknown> | null = null;
  @Input() submitted = false;

  protected get resolvedControl(): FormControl<unknown> | null {
    if (this.controlInput) {
      return this.controlInput;
    }

    if (!this.formGroup) {
      return null;
    }

    return this.formSchemaFormService.controlFor(this.formGroup, this.field) as FormControl<unknown> | null;
  }

  protected markTouched(): void {
    this.resolvedControl?.markAsTouched();
  }

  protected get placeholderLabel(): string {
    return this.field.properties.placeHolder || this.field.localizations['selectionDefaultPlaceholder'] || 'Select an option';
  }
}
