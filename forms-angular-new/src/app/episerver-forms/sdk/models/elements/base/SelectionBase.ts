import type { FeedItem } from '../../form-element.model';
import type { InputElementBase, InputElementBaseProperties } from './InputElementBase';

export interface SelectionBase extends InputElementBase {
  properties: SelectionBaseProperties;
}

export interface SelectionBaseProperties extends InputElementBaseProperties {
  allowMultiSelect: boolean;
  feed: string;
  items: FeedItem[];
  predefinedValue: string;
}

export type { FeedItem };
