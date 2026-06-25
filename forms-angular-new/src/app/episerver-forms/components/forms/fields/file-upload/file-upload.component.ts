import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FormUploadedFile } from '../../../../models/form-schema.model';

@Component({
  selector: 'lib-file-upload',
  templateUrl: './file-upload.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileUploadComponent implements OnChanges {
  @Input() title = 'Upload file';
  @Input() control: FormControl | null = null;
  @Input() maxFileSize = 20 * 1024 * 1024;
  @Input() documentType = '';
  @Input() acceptedFileTypes = '.jpg,.jpeg,.png,.pdf';
  @Input() multiple = false;
  @Input() maxFiles = 1;
  @Input() selectedFiles: FormUploadedFile[] = [];
  @Input() disabled = false;
  @Input() showTitle = true;
  @Input() showSelectedFiles = true;
  @Input() buttonText = 'Select a file from your device';
  @Output() selectedFilesChange = new EventEmitter<FormUploadedFile[]>();

  draggedFiles: FormUploadedFile[] = [];
  tooltipText = '';
  fileUploadErrorMsg = '';

  constructor(readonly cdr: ChangeDetectorRef) {}

  ngOnChanges(_changes: SimpleChanges): void {
    this.draggedFiles = this.normalizeFiles(this.control?.value ?? this.selectedFiles);
  }

  get allowedFileExtensions(): string[] {
    return this.acceptedFileTypes
      .split(',')
      .map(type => type.trim().replace(/^\./, '').toLowerCase())
      .filter(Boolean);
  }

  get hasError(): boolean {
    return Boolean(this.fileUploadErrorMsg);
  }

  handleFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) {
      return;
    }

    const newEntries = files.map(file => ({
      name: file.name,
      size: file.size,
      url: '',
      assetGuid: '',
      file
    }));
    const nextFiles = this.multiple ? [...this.draggedFiles, ...newEntries] : [newEntries[0]];
    const error = this.validateFiles(nextFiles);
    if (error) {
      this.fileUploadErrorMsg = error;
      this.tooltipText = 'Invalid file selected';
      input.value = '';
      this.cdr.markForCheck();
      return;
    }

    this.draggedFiles = nextFiles;
    this.fileUploadErrorMsg = '';
    this.tooltipText = 'File is valid';
    this.selectedFilesChange.emit([...this.draggedFiles]);
    this.syncControlValue();
    input.value = '';
    this.cdr.markForCheck();
  }

  deleteFile(index: number): void {
    this.draggedFiles = this.draggedFiles.filter((_, currentIndex) => currentIndex !== index);
    this.fileUploadErrorMsg = '';
    this.tooltipText = ' ';
    this.selectedFilesChange.emit([...this.draggedFiles]);
    this.syncControlValue();
    this.cdr.markForCheck();
  }

  formatFileSize(bytes: number, decimalPoint?: number): string {
    if (bytes === 0) {
      return '0 Bytes';
    }

    const k = 1000;
    const dm = decimalPoint ?? 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  formatLimitLabel(bytes: number): string {
    const sizeInMb = bytes / (1024 * 1024);
    return Number.isInteger(sizeInMb) ? `${sizeInMb}MB` : `${sizeInMb.toFixed(1)}MB`;
  }

  private validateFiles(files: FormUploadedFile[]): string {
    if (files.length > this.maxFiles) {
      return this.maxFiles === 1 ? 'You can upload 1 file only.' : `You can upload up to ${this.maxFiles} files.`;
    }

    const invalidExtensionFile = files.find(file => {
      const extension = (file.name ?? file.file?.name ?? '').split('.').pop()?.toLowerCase() ?? '';
      return !this.allowedFileExtensions.includes(extension);
    });
    if (invalidExtensionFile) {
      return 'The selected file type is not allowed.';
    }

    const oversizedFile = files.find(file => this.fileSize(file) > this.maxFileSize);
    if (oversizedFile) {
      return `The file size must be ${this.formatLimitLabel(this.maxFileSize)} or less.`;
    }

    return '';
  }

  private syncControlValue(): void {
    if (!this.control) {
      return;
    }

    if (this.multiple) {
      this.control.setValue([...this.draggedFiles]);
      return;
    }

    this.control.setValue(this.draggedFiles[0] ?? null);
  }

  private normalizeFiles(value: unknown): FormUploadedFile[] {
    if (Array.isArray(value)) {
      return value
        .map(entry => this.normalizeFile(entry))
        .filter((entry): entry is FormUploadedFile => entry !== null);
    }

    const normalized = this.normalizeFile(value);
    return normalized ? [normalized] : [];
  }

  private normalizeFile(value: unknown): FormUploadedFile | null {
    if (value instanceof File) {
      return {
        name: value.name,
        size: value.size,
        url: undefined,
        assetGuid: undefined,
        file: value
      };
    }

    if (!value || typeof value !== 'object') {
      return null;
    }

    const file = value as Record<string, unknown>;
    const browserFile = file['file'] instanceof File ? file['file'] : undefined;
    const name = this.readString(file, ['name', 'Name', 'fileName', 'FileName']) ?? browserFile?.name ?? null;
    const url = this.readString(file, ['url', 'Url', 'downloadUrl', 'DownloadUrl', 'value', 'Value']);
    const assetGuid = this.readString(file, ['assetGuid', 'AssetGuid']);
    const size = this.readNumber(file, ['size', 'Size']) ?? browserFile?.size ?? undefined;

    if (!name && !url && !browserFile) {
      return null;
    }

    return {
      name: name ?? url?.split('/').pop() ?? 'File',
      size,
      url: url ?? undefined,
      assetGuid: assetGuid ?? undefined,
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
