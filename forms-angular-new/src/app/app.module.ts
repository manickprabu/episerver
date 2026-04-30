import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { App } from './app';
import { DynamicJsonFormPageComponent } from './pages/dynamic-json-form-page/dynamic-json-form-page.component';
import { EpiserverFormsModule } from './episerver-forms/episerver-forms.module';

@NgModule({
  declarations: [App, DynamicJsonFormPageComponent],
  imports: [BrowserModule, AppRoutingModule, EpiserverFormsModule],
  providers: [],
  bootstrap: [App]
})
export class AppModule {}
