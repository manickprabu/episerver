import { DestroyRef, Injectable, signal } from '@angular/core';
import { catchError, EMPTY, finalize, interval, map, Observable, startWith } from 'rxjs';

import { IdentityInfo } from '../../episerver-forms/sdk';
import { FormAuthService } from './form-auth.service';

@Injectable()
export class FormLoginStateService {
  readonly isAuthenticated = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  constructor(private readonly formAuthService: FormAuthService) {
    this.isAuthenticated.set(Boolean(this.formAuthService.getAccessToken()));
  }

  watchAccessToken(destroyRef: DestroyRef): void {
    const subscription = interval(1000)
      .pipe(startWith(0))
      .subscribe(() => this.isAuthenticated.set(Boolean(this.formAuthService.getAccessToken())));

    destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  login(username: string, password: string, clientId: string, authBaseUrl: string): Observable<IdentityInfo> {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    return this.formAuthService.login(username, password, clientId, authBaseUrl).pipe(
      map((identityInfo) => {
        this.isAuthenticated.set(true);
        return identityInfo;
      }),
      catchError(() => {
        this.isAuthenticated.set(false);
        this.errorMessage.set('Wrong credentials.');
        return EMPTY;
      }),
      finalize(() => this.isSubmitting.set(false))
    );
  }
}
