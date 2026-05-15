import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { App } from './app';
import { EpiserverFormAccordionComponent } from './pages/episerver-form-accordion/episerver-form-accordion.component';
import { EpiserverNewFormComponent } from './pages/episerver-new-form/episerver-new-form.component';
import { LibAccordionComponent } from './pages/lib-accordion/lib-accordion.component';
import { EpiserverFormsModule } from './episerver-forms/episerver-forms.module';

@NgModule({
  declarations: [App, EpiserverFormAccordionComponent, EpiserverNewFormComponent, LibAccordionComponent],
  imports: [BrowserModule, AppRoutingModule, EpiserverFormsModule],
  providers: [],
  bootstrap: [App]
})
export class AppModule {}
