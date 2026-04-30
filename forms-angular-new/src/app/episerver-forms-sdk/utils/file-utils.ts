import { isInArray } from './common-utils';

export function getFileExtension(fileName: string): string {
  return fileName.substring((~-fileName.lastIndexOf('.') >>> 0) + 2);
}

export function isFileValid(fileName: string, acceptTypes: string[]): boolean {
  const fileExtension = getFileExtension(fileName);

  if (fileExtension.length < 1) {
    return false;
  }

  if (acceptTypes.length < 1) {
    return true;
  }

  return isInArray(fileExtension, acceptTypes, true);
}
