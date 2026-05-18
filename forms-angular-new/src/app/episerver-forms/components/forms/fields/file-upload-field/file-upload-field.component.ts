import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormField } from '../../../../models/form-schema.model';
import { FormSchemaFormService } from '../../../../services/form-schema-form.service';

@Component({
  selector: 'lib-file-upload-field',
  standalone: false,
  templateUrl: './file-upload-field.component.html',
  styleUrls: ['./file-upload-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileUploadFieldComponent {
  constructor(private readonly formSchemaFormService: FormSchemaFormService) {}

  @Input() field!: FormField;
  @Input() formGroup!: FormGroup;
  @Input() submitted = false;

  protected get control() {
    return this.formSchemaFormService.controlFor(this.formGroup, this.field);
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).map(file => ({ name: file.name, file }));
    const control = this.control;
    control?.setValue(files);
    control?.markAsTouched();
  }
}
