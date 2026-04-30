import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { EpiserverFormsShellComponent } from './components/episerver-forms-shell/episerver-forms-shell.component';
import { EpiserverFormsService } from './services/episerver-forms.service';

@NgModule({
  declarations: [EpiserverFormsShellComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  exports: [EpiserverFormsShellComponent],
  providers: [EpiserverFormsService]
})
export class EpiserverFormsModule {}
