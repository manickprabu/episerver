import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { EpiserverFormAccordionComponent } from './pages/episerver-form-accordion/episerver-form-accordion.component';
import { EpiserverNewFormComponent } from './pages/episerver-new-form/episerver-new-form.component';

const routes: Routes = [
  { path: '', redirectTo: 'episerver-new-form', pathMatch: 'full' },
  { path: 'episerver-new-form', component: EpiserverNewFormComponent },
  { path: 'episerver-form-accordion', component: EpiserverFormAccordionComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
