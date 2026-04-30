import type { ValidatableElementBase, ValidatableElementBaseProperties } from './base/ValidatableElementBase';

export interface Captcha extends ValidatableElementBase {
  properties: CaptchaProperties;
}

export interface CaptchaProperties extends ValidatableElementBaseProperties {
  refreshButtonLabel: string;
  captchaImageHandler: string;
  imageWidth: number;
  imageHeight: number;
  captchaImageAlt: string;
  textLength: number;
}
