import type { InputElementBase, InputElementBaseProperties } from './base';

export interface FeedImageItem {
  text: string;
  url: string;
  target: string;
  title: string;
}

export interface ImageChoice extends InputElementBase {
  properties: ImageChoiceProperties;
}

export interface ImageChoiceProperties extends InputElementBaseProperties {
  showSelectionInputControl: boolean;
  allowMultiSelect: boolean;
  items: FeedImageItem[];
}
