import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { EpiserverFormAccordionComponent } from './pages/episerver-form-accordion/episerver-form-accordion.component';

const routes: Routes = [
  { path: '', redirectTo: 'episerver-form-accordion', pathMatch: 'full' },
  { path: 'episerver-form-accordion', component: EpiserverFormAccordionComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
