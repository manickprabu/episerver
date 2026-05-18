import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormField } from '../../../../models/form-schema.model';
import { FormSchemaFormService } from '../../../../services/form-schema-form.service';

@Component({
  selector: 'lib-url-field',
  standalone: false,
  templateUrl: './url-field.component.html',
  styleUrls: ['./url-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UrlFieldComponent {
  constructor(private readonly formSchemaFormService: FormSchemaFormService) {}

  @Input() field!: FormField;
  @Input() formGroup!: FormGroup;
  @Input() submitted = false;

  protected get control() {
    return this.formSchemaFormService.controlFor(this.formGroup, this.field);
  }
}
