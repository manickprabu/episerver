import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormField, FormUploadedFile } from '../../../../models/form-schema.model';
import { FormSchemaFormService } from '../../../../services/form-schema-form.service';

const MAX_UPLOAD_FILES = 5;
const MAX_UPLOAD_FILE_SIZE_BYTES = 5 * 1024 * 1024;

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
  protected isModalOpen = false;
  protected draftFiles: FormUploadedFile[] = [];
  protected selectionError = '';

  protected get control() {
    return this.formSchemaFormService.controlFor(this.formGroup, this.field);
  }

  protected get selectedFiles(): FormUploadedFile[] {
    return Array.isArray(this.control?.value) ? (this.control?.value as FormUploadedFile[]) : [];
  }

  protected get hasReachedFileLimit(): boolean {
    return this.draftFiles.length >= MAX_UPLOAD_FILES;
  }

  protected openModal(): void {
    this.draftFiles = [...this.selectedFiles];
    this.selectionError = '';
    this.isModalOpen = true;
  }

  protected closeModal(): void {
    this.isModalOpen = false;
    this.draftFiles = [];
    this.selectionError = '';
  }

  protected confirmSelection(): void {
    this.updateControl(this.draftFiles);
    this.closeModal();
  }

  protected removeSelectedFile(index: number): void {
    const nextFiles = this.selectedFiles.filter((_, currentIndex) => currentIndex !== index);
    this.updateControl(nextFiles);

    if (this.isModalOpen) {
      this.draftFiles = [...nextFiles];
    }
  }

  protected removeDraftFile(index: number): void {
    this.draftFiles = this.draftFiles.filter((_, currentIndex) => currentIndex !== index);
    this.selectionError = '';
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newFiles = Array.from(input.files ?? []).map(file => ({ name: file.name, file }));
    if (!newFiles.length) {
      return;
    }

    const nextFiles = [...this.draftFiles, ...newFiles];
    const errorMessage = this.validateFiles(nextFiles);
    if (errorMessage) {
      this.selectionError = errorMessage;
      this.control?.markAsTouched();
      input.value = '';
      return;
    }

    this.draftFiles = nextFiles;
    this.selectionError = '';
    input.value = '';
  }

  protected trackFile(index: number, file: FormUploadedFile): string {
    return `${file.name ?? 'file'}-${file.file?.size ?? 0}-${file.file?.lastModified ?? index}`;
  }

  protected fileSizeLabel(file: FormUploadedFile): string {
    const size = file.file?.size ?? 0;
    if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    if (size >= 1024) {
      return `${Math.round(size / 1024)} KB`;
    }

    return `${size} B`;
  }

  private updateControl(files: FormUploadedFile[]): void {
    const control = this.control;
    control?.setValue([...files]);
    control?.markAsTouched();
    control?.updateValueAndValidity();
  }

  private validateFiles(files: FormUploadedFile[]): string {
    if (files.length > MAX_UPLOAD_FILES) {
      return 'You can upload up to 5 files.';
    }

    const oversizedFile = files.find(entry => (entry.file?.size ?? 0) > MAX_UPLOAD_FILE_SIZE_BYTES);
    if (oversizedFile) {
      return `${oversizedFile.name ?? oversizedFile.file?.name ?? 'File'} exceeds the 5MB limit.`;
    }

    return '';
  }
}
