import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { EpiserverFormsModule } from '../../../../episerver-forms/episerver-forms.module';
import { IdentityInfo } from '../../../../episerver-forms/services/form-auth.service';

@Component({
  selector: 'lib-form-login-page',
  standalone: true,
  imports: [EpiserverFormsModule],
  templateUrl: './form-login-page.component.html',
  styleUrl: './form-login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormLoginPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);

  protected readonly clientId = signal('');
  protected readonly authBaseUrl = signal('');
  protected readonly identityInfo = signal<IdentityInfo | null>(null);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const routeDefaults = this.route.snapshot.data;

      this.clientId.set(params.get('clientId') ?? routeDefaults['clientId'] ?? '');
      this.authBaseUrl.set(params.get('authBaseUrl') ?? routeDefaults['authBaseUrl'] ?? '');
    });
  }

  protected handleAuthenticated(identityInfo: IdentityInfo): void {
    this.identityInfo.set(identityInfo);
  }
}
