import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageShellComponent } from '../../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'app-form-step-page',
  standalone: true,
  imports: [PageShellComponent],
  templateUrl: './form-step-page.component.html',
  styleUrl: './form-step-page.component.scss'
})
export class FormStepPageComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly stepSlug = this.route.snapshot.paramMap.get('stepSlug') ?? 'unknown-step';
}
