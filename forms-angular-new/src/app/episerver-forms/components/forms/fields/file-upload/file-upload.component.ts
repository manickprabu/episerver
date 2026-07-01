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
    return this.acceptTokens
      .filter(token => token.kind === 'extension')
      .map(token => token.value);
  }

  get hasError(): boolean {
    return Boolean(this.fileUploadErrorMsg);
  }

  get normalizedAcceptedFileTypes(): string {
    return this.acceptTokens
      .map(token => {
        switch (token.kind) {
          case 'extension':
            return `.${token.value}`;
          case 'mime':
          case 'mimeWildcard':
            return token.value;
        }
      })
      .join(',');
  }

  async handleFileInput(event: Event): Promise<void> {
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
    const previousFiles = [...this.draggedFiles];
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

    try {
      const suspiciousContentError = await this.validateFileContents(newEntries);
      if (suspiciousContentError) {
        this.draggedFiles = previousFiles;
        this.fileUploadErrorMsg = suspiciousContentError;
        this.tooltipText = 'Invalid file selected';
        this.selectedFilesChange.emit([...this.draggedFiles]);
        this.syncControlValue();
      }
    } catch {
      // Keep uploads working when the browser cannot expose file headers for best-effort inspection.
    } finally {
      input.value = '';
      this.cdr.markForCheck();
    }
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

    const invalidExtensionFile = files.find(file => !this.isAllowedFileType(file));
    if (invalidExtensionFile) {
      return 'The selected file type is not allowed.';
    }

    const oversizedFile = files.find(file => this.fileSize(file) > this.maxFileSize);
    if (oversizedFile) {
      return `The file size must be ${this.formatLimitLabel(this.maxFileSize)} or less.`;
    }

    return '';
  }

  private async validateFileContents(files: FormUploadedFile[]): Promise<string> {
    for (const file of files) {
      if (!file.file) {
        continue;
      }

      const header = await this.readFileHeader(file.file, 16);
      if (this.looksLikeExecutable(header)) {
        return 'The selected file content is not allowed.';
      }
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

  private isAllowedFileType(file: FormUploadedFile): boolean {
    if (this.acceptTokens.length === 0) {
      return true;
    }

    const fileName = file.name ?? file.file?.name ?? '';
    const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() ?? '' : '';
    const mimeType = file.file?.type?.toLowerCase() ?? '';

    return this.acceptTokens.some(token => {
      switch (token.kind) {
        case 'extension':
          return !!extension && extension === token.value;
        case 'mime':
          return !!mimeType && mimeType === token.value;
        case 'mimeWildcard':
          return !!mimeType && mimeType.startsWith(`${token.value}/`);
      }
    });
  }

  private async readFileHeader(file: File, length: number): Promise<Uint8Array> {
    const headerBlob = file.slice(0, length);

    if (typeof headerBlob.arrayBuffer === 'function') {
      const bytes = await headerBlob.arrayBuffer();
      return new Uint8Array(bytes);
    }

    if (typeof FileReader === 'undefined') {
      return new Uint8Array();
    }

    return await new Promise<Uint8Array>(resolve => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result;
        resolve(result instanceof ArrayBuffer ? new Uint8Array(result) : new Uint8Array());
      };

      reader.onerror = () => resolve(new Uint8Array());
      reader.readAsArrayBuffer(headerBlob);
    });
  }

  private looksLikeExecutable(header: Uint8Array): boolean {
    if (header.length < 4) {
      return false;
    }

    return (
      this.matchesBytes(header, [0x4d, 0x5a]) ||
      this.matchesBytes(header, [0x7f, 0x45, 0x4c, 0x46]) ||
      this.matchesBytes(header, [0xfe, 0xed, 0xfa, 0xce]) ||
      this.matchesBytes(header, [0xfe, 0xed, 0xfa, 0xcf]) ||
      this.matchesBytes(header, [0xce, 0xfa, 0xed, 0xfe]) ||
      this.matchesBytes(header, [0xcf, 0xfa, 0xed, 0xfe]) ||
      this.matchesBytes(header, [0xca, 0xfe, 0xba, 0xbe]) ||
      this.matchesBytes(header, [0xbe, 0xba, 0xfe, 0xca])
    );
  }

  private matchesBytes(header: Uint8Array, signature: number[]): boolean {
    if (header.length < signature.length) {
      return false;
    }

    return signature.every((byte, index) => header[index] === byte);
  }

  private get acceptTokens(): Array<{ kind: 'extension' | 'mime' | 'mimeWildcard'; value: string }> {
    return this.acceptedFileTypes
      .split(',')
      .map(type => this.normalizeAcceptToken(type))
      .filter((token): token is { kind: 'extension' | 'mime' | 'mimeWildcard'; value: string } => token !== null);
  }

  private normalizeAcceptToken(value: string): { kind: 'extension' | 'mime' | 'mimeWildcard'; value: string } | null {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    if (/^[a-z0-9]+$/.test(normalized)) {
      return { kind: 'extension', value: normalized };
    }

    if (normalized.startsWith('.')) {
      return { kind: 'extension', value: normalized.replace(/^\./, '') };
    }

    if (/^[a-z0-9!#$&^_.+-]+\/\*$/.test(normalized)) {
      return { kind: 'mimeWildcard', value: normalized.slice(0, normalized.indexOf('/')) };
    }

    if (/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(normalized)) {
      return { kind: 'mime', value: normalized };
    }

    return null;
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
