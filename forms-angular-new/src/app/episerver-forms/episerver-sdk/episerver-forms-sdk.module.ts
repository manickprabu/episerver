import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';

import {
  ApiClientService,
  BrowserStorageService,
  ConditionFunctionsService,
  FormAuthenticateService,
  FormCacheService,
  FormDependConditionsService,
  FormLoaderService,
  FormStateInitService,
  FormStorageService,
  FormSubmitService,
  FormValidatorService,
  StepBuilderService,
  StepDependConditionService,
  StepHelperService
} from './services';

@NgModule({
  imports: [CommonModule, HttpClientModule],
  providers: [
    ApiClientService,
    BrowserStorageService,
    ConditionFunctionsService,
    FormAuthenticateService,
    FormCacheService,
    FormDependConditionsService,
    FormLoaderService,
    FormStateInitService,
    FormStorageService,
    FormSubmitService,
    FormValidatorService,
    StepBuilderService,
    StepDependConditionService,
    StepHelperService
  ]
})
export class EpiserverFormsSdkModule {}
