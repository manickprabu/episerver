import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormField, FormUploadedFile } from '../../../../models/form-schema.model';
import { FormSchemaFormService } from '../../../../services/form-schema-form.service';

const DEFAULT_MAX_UPLOAD_FILES = 5;
const DEFAULT_MAX_UPLOAD_FILE_SIZE_BYTES = 5 * 1024 * 1024;

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
    return this.normalizeFiles(this.control?.value);
  }

  protected get hasReachedFileLimit(): boolean {
    return this.draftFiles.length >= this.maxUploadFiles;
  }

  protected get maxUploadFiles(): number {
    return this.field.properties.allowMultiple === false ? 1 : DEFAULT_MAX_UPLOAD_FILES;
  }

  protected get allowMultipleUploads(): boolean {
    return this.maxUploadFiles > 1;
  }

  protected get maxUploadFileSizeLabel(): string {
    const sizeInMb = this.maxUploadFileSizeBytes / (1024 * 1024);
    return Number.isInteger(sizeInMb) ? `${sizeInMb}MB` : `${sizeInMb.toFixed(1)}MB`;
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

  protected canViewFile(file: FormUploadedFile): boolean {
    return Boolean(file.url || file.file);
  }

  protected viewFile(file: FormUploadedFile): void {
    const url = file.url ?? (file.file ? URL.createObjectURL(file.file) : null);
    if (!url) {
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');

    if (!file.url && file.file) {
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newFiles = Array.from(input.files ?? []).map(file => ({
      name: file.name,
      size: file.size,
      file
    }));
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
    return `${file.name ?? 'file'}-${file.url ?? 'local'}-${this.fileSize(file)}-${file.file?.lastModified ?? index}`;
  }

  protected fileSizeLabel(file: FormUploadedFile): string {
    const size = this.fileSize(file);
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
    control?.setValue(this.normalizeFiles(files));
    control?.markAsTouched();
    control?.updateValueAndValidity();
  }

  private validateFiles(files: FormUploadedFile[]): string {
    if (files.length > this.maxUploadFiles) {
      return this.maxUploadFiles === 1 ? 'You can upload 1 file only.' : `You can upload up to ${this.maxUploadFiles} files.`;
    }

    const oversizedFile = files.find(entry => this.fileSize(entry) > this.maxUploadFileSizeBytes);
    if (oversizedFile) {
      return `${oversizedFile.name ?? oversizedFile.file?.name ?? 'File'} exceeds the ${this.maxUploadFileSizeLabel} limit.`;
    }

    return '';
  }

  private get maxUploadFileSizeBytes(): number {
    if (typeof this.field.properties.fileSize === 'number' && Number.isFinite(this.field.properties.fileSize) && this.field.properties.fileSize > 0) {
      return this.field.properties.fileSize * 1024 * 1024;
    }

    return DEFAULT_MAX_UPLOAD_FILE_SIZE_BYTES;
  }

  private normalizeFiles(value: unknown): FormUploadedFile[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map(entry => this.normalizeFile(entry))
      .filter((entry): entry is FormUploadedFile => entry !== null);
  }

  private normalizeFile(value: unknown): FormUploadedFile | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const file = value as Record<string, unknown>;
    const browserFile = file['file'] instanceof File ? file['file'] : undefined;
    const name = this.readString(file, ['name', 'Name', 'fileName', 'FileName']);
    const url = this.readString(file, ['url', 'Url', 'downloadUrl', 'DownloadUrl', 'value', 'Value']);
    const size = this.readNumber(file, ['size', 'Size']);

    if (!name && !url && !browserFile) {
      return null;
    }

    return {
      name: name ?? browserFile?.name ?? url?.split('/').pop() ?? 'File',
      size: size ?? browserFile?.size ?? undefined,
      url: url ?? undefined,
      file: browserFile
    };
  }

  private fileSize(file: FormUploadedFile): number {
    return typeof file.size === 'number' ? file.size : (file.file?.size ?? 0);
  }

  private readString(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return null;
  }

  private readNumber(source: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
    }

    return null;
  }
}
