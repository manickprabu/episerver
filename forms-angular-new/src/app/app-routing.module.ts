import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DynamicJsonFormPageComponent } from './pages/dynamic-json-form-page/dynamic-json-form-page.component';

const routes: Routes = [
  { path: '', redirectTo: 'dynamic-json-form', pathMatch: 'full' },
  { path: 'dynamic-json-form', component: DynamicJsonFormPageComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
