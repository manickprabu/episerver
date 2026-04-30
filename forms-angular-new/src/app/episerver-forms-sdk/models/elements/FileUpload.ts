import type { ConditionProperties, ValidatableElementBaseProperties } from '../form-element.model';
import type { ValidatableElementBase } from './base/ValidatableElementBase';

export interface FileUpload extends ValidatableElementBase {
  properties: FileUploadProperties;
}

export interface FileUploadProperties extends ValidatableElementBaseProperties, ConditionProperties {
  allowMultiple: boolean;
  fileTypes: string;
  fileSize: number;
  fileExtensions: string;
  description: string;
}
