import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { App } from './app';
import { EpiserverFormsModule } from './episerver-forms/episerver-forms.module';
import { EpiserverFormsSdkModule } from './episerver-forms-sdk';

@NgModule({
  declarations: [App],
  imports: [BrowserModule, AppRoutingModule, EpiserverFormsModule, EpiserverFormsSdkModule],
  providers: [],
  bootstrap: [App]
})
export class AppModule {}
