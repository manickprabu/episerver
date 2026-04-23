import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormSchema } from '../../../../core/models/form-schema.model';
import { FormLoaderService } from '../../../../core/services/form-loader.service';
import { FormContainerComponent } from '../../../../shared/components/forms/form-container/form-container.component';
import { PageShellComponent } from '../../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'app-form-render-page',
  standalone: true,
  imports: [PageShellComponent, FormContainerComponent],
  templateUrl: './form-render-page.component.html',
  styleUrl: './form-render-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormRenderPageComponent {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly formLoaderService = inject(FormLoaderService);

  protected readonly form = signal<FormSchema | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string>('');
  protected readonly formKey = signal('');
  protected readonly language = signal('en');
  protected readonly baseUrl = signal('/');
  protected readonly optiGraphUrl = signal('');
  protected readonly currentPageUrl = computed(() => this.document.location?.href ?? '/forms');

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const routeDefaults = this.route.snapshot.data;

      this.formKey.set(params.get('formKey') ?? routeDefaults['formKey'] ?? '');
      this.language.set(params.get('language') ?? routeDefaults['language'] ?? 'en');
      this.baseUrl.set(params.get('baseUrl') ?? routeDefaults['baseUrl'] ?? '/');
      this.optiGraphUrl.set(params.get('optiGraphUrl') ?? routeDefaults['optiGraphUrl'] ?? '');

      this.loadForm();
    });
  }

  private loadForm(): void {
    if (!this.formKey()) {
      this.form.set(null);
      this.error.set('');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.formLoaderService
      .loadForm({
        formKey: this.formKey(),
        language: this.language(),
        baseUrl: this.baseUrl(),
        optiGraphUrl: this.optiGraphUrl() || undefined
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (form) => {
          this.form.set(form);
          if (!form) {
            this.error.set('No form was returned for this key.');
          }
          this.loading.set(false);
        },
        error: (error) => {
          this.form.set(null);
          this.error.set(error?.message || 'Form metadata could not be loaded.');
          this.loading.set(false);
        }
      });
  }
}
