import { DestroyRef, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, EMPTY, finalize, interval, map, Observable, startWith, Subject } from 'rxjs';

import { IdentityInfo } from '../../episerver-forms/episerver-sdk';
import { FormAuthService } from './form-auth.service';

@Injectable()
export class FormLoginStateService {
  private readonly isAuthenticatedSubject = new BehaviorSubject(false);
  private readonly isSubmittingSubject = new BehaviorSubject(false);
  private readonly errorMessageSubject = new BehaviorSubject('');
  private readonly stateChangesSubject = new Subject<void>();

  readonly stateChanges$ = this.stateChangesSubject.asObservable();

  constructor(private readonly formAuthService: FormAuthService) {
    this.isAuthenticated = Boolean(this.formAuthService.getAccessToken());
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  set isAuthenticated(value: boolean) {
    this.isAuthenticatedSubject.next(value);
    this.stateChangesSubject.next();
  }

  get isSubmitting(): boolean {
    return this.isSubmittingSubject.value;
  }

  set isSubmitting(value: boolean) {
    this.isSubmittingSubject.next(value);
    this.stateChangesSubject.next();
  }

  get errorMessage(): string {
    return this.errorMessageSubject.value;
  }

  set errorMessage(value: string) {
    this.errorMessageSubject.next(value);
    this.stateChangesSubject.next();
  }

  watchAccessToken(destroyRef: DestroyRef): void {
    const subscription = interval(1000)
      .pipe(startWith(0))
      .subscribe(() => {
        this.isAuthenticated = Boolean(this.formAuthService.getAccessToken());
      });

    destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  login(username: string, password: string, clientId: string, authBaseUrl: string): Observable<IdentityInfo> {
    this.isSubmitting = true;
    this.errorMessage = '';

    return this.formAuthService.login(username, password, clientId, authBaseUrl).pipe(
      map(identityInfo => {
        this.isAuthenticated = true;
        return identityInfo;
      }),
      catchError(() => {
        this.isAuthenticated = false;
        this.errorMessage = 'Wrong credentials.';
        return EMPTY;
      }),
      finalize(() => {
        this.isSubmitting = false;
      })
    );
  }
}
