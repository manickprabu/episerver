import type { HiddenElementBase, HiddenElementBaseProperties } from './base';

export interface PredefinedHidden extends HiddenElementBase {
  properties: PredefinedHiddenProperties;
}

export interface PredefinedHiddenProperties extends HiddenElementBaseProperties {}
