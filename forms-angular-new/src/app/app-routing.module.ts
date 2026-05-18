import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { EpiserverFormComponent } from './pages/episerver-form/episerver-form.component';
import { EpiserverFormAccordionComponent } from './pages/episerver-form-accordion/episerver-form-accordion.component';
import { EpiserverNewFormComponent } from './pages/episerver-new-form/episerver-new-form.component';

const routes: Routes = [
  { path: '', redirectTo: 'episerver-form', pathMatch: 'full' },
  { path: 'episerver-form', component: EpiserverFormComponent },
  { path: 'episerver-new-form', component: EpiserverNewFormComponent },
  { path: 'episerver-form-accordion', component: EpiserverFormAccordionComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
