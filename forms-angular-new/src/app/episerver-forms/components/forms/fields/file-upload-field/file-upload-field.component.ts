import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormField, FormUploadedFile } from '../../../../models/form-schema.model';
import { FormSchemaFormService } from '../../../../services/form-schema-form.service';

const DEFAULT_MAX_UPLOAD_FILES = 5;
const DEFAULT_MAX_UPLOAD_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const DEFAULT_UPLOAD_FILE_TYPES = '.pdf,.doc,.txt';

@Component({
  selector: 'lib-file-upload-field',
  standalone: false,
  templateUrl: './file-upload-field.component.html',
  styleUrls: ['./file-upload-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileUploadFieldComponent {
  constructor(
    private readonly formSchemaFormService: FormSchemaFormService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  @Input() field!: FormField;
  @Input() formGroup!: FormGroup;
  @Input() submitted = false;
  @Input() apiBaseURLPrefix = '';
  protected isModalOpen = false;
  protected draftFiles: FormUploadedFile[] = [];
  protected draftUploadErrorMsg = '';

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

  protected get allowedFileExtensions(): string[] {
    return this.acceptTokens
      .filter(token => token.kind === 'extension')
      .map(token => token.value);
  }

  protected get acceptedFileTypes(): string {
    return typeof this.field.properties.fileTypes === 'string' && this.field.properties.fileTypes.trim()
      ? this.field.properties.fileTypes
      : DEFAULT_UPLOAD_FILE_TYPES;
  }

  protected get normalizedAcceptedFileTypes(): string {
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

  protected openModal(): void {
    this.draftFiles = [...this.selectedFiles];
    this.draftUploadErrorMsg = '';
    this.isModalOpen = true;
  }

  protected closeModal(): void {
    this.isModalOpen = false;
    this.draftFiles = [];
    this.draftUploadErrorMsg = '';
  }

  protected confirmSelection(): void {
    if (this.draftUploadErrorMsg) {
      return;
    }

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
    this.draftUploadErrorMsg = '';
  }

  protected async handleDraftFileInput(event: Event): Promise<void> {
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
    const previousFiles = [...this.draftFiles];
    const nextFiles = this.allowMultipleUploads ? [...this.draftFiles, ...newEntries] : [newEntries[0]];
    const error = this.validateFiles(nextFiles);

    if (error) {
      this.draftUploadErrorMsg = error;
      input.value = '';
      this.cdr.markForCheck();
      return;
    }

    this.draftFiles = nextFiles;
    this.draftUploadErrorMsg = '';

    try {
      const suspiciousContentError = await this.validateFileContents(newEntries);
      if (suspiciousContentError) {
        this.draftFiles = previousFiles;
        this.draftUploadErrorMsg = suspiciousContentError;
      }
    } catch {
      // Keep uploads working when the browser cannot expose file headers for best-effort inspection.
    } finally {
      input.value = '';
      this.cdr.markForCheck();
    }
  }

  protected canViewFile(file: FormUploadedFile): boolean {
    return Boolean(file.url || file.file);
  }

  protected viewFile(file: FormUploadedFile): void {
    const url = file.url ? this.resolveExistingFileUrl(file.url) : (file.file ? URL.createObjectURL(file.file) : null);
    if (!url) {
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');

    if (!file.url && file.file) {
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
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

  protected get maxUploadFileSizeBytes(): number {
    if (typeof this.field.properties.fileSize === 'number' && Number.isFinite(this.field.properties.fileSize) && this.field.properties.fileSize > 0) {
      return this.field.properties.fileSize * 1024 * 1024;
    }

    return DEFAULT_MAX_UPLOAD_FILE_SIZE_BYTES;
  }

  private validateFiles(files: FormUploadedFile[]): string {
    if (files.length > this.maxUploadFiles) {
      return this.maxUploadFiles === 1 ? 'You can upload 1 file only.' : `You can upload up to ${this.maxUploadFiles} files.`;
    }

    const invalidExtensionFile = files.find(file => !this.isAllowedFileType(file));
    if (invalidExtensionFile) {
      return 'The selected file type is not allowed.';
    }

    const oversizedFile = files.find(file => this.fileSize(file) > this.maxUploadFileSizeBytes);
    if (oversizedFile) {
      return `The file size must be ${this.maxUploadFileSizeLabel} or less.`;
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
    const name = this.readString(file, ['name', 'Name', 'fileName', 'FileName']);
    const url = this.readString(file, ['url', 'Url', 'downloadUrl', 'DownloadUrl', 'value', 'Value']);
    const assetGuid = this.readString(file, ['assetGuid', 'AssetGuid']);
    const size = this.readNumber(file, ['size', 'Size']);

    if (!name && !url && !browserFile) {
      return null;
    }

    return {
      name: name ?? browserFile?.name ?? url?.split('/').pop() ?? 'File',
      size: size ?? browserFile?.size ?? undefined,
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

  private resolveExistingFileUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    const baseUrlPrefix = this.apiBaseURLPrefix;
    if (!baseUrlPrefix) {
      return url;
    }

    return `${baseUrlPrefix.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
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
