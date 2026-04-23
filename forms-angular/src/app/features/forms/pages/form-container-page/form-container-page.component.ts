import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormSubmissionResult } from '../../../../core/models/form-schema.model';
import { FormContainerComponent } from '../../../../shared/components/forms/form-container/form-container.component';
import { PageShellComponent } from '../../../../shared/components/page-shell/page-shell.component';
import { sampleSupportRequestForm } from './form-container-page.schema';

@Component({
  selector: 'app-form-container-page',
  standalone: true,
  imports: [PageShellComponent, FormContainerComponent],
  templateUrl: './form-container-page.component.html',
  styleUrl: './form-container-page.component.scss'
})
export class FormContainerPageComponent {
  private readonly document = inject(DOCUMENT);

  protected readonly form = sampleSupportRequestForm;
  protected readonly baseUrl = signal('/');
  protected readonly lastSubmission = signal<FormSubmissionResult | null>(null);
  protected readonly currentPageUrl = computed(() => this.document.location?.href ?? '/forms/container');

  protected handleSubmitted(result: FormSubmissionResult): void {
    this.lastSubmission.set(result);
  }
}
