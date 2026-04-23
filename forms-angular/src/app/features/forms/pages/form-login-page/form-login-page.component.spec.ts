import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { FormLoginPageComponent } from './form-login-page.component';

describe('FormLoginPageComponent', () => {
  beforeEach(async () => {
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [FormLoginPageComponent],
      providers: [
        provideHttpClient(),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({})),
            snapshot: {
              data: {
                clientId: 'TestClient',
                authBaseUrl: ''
              }
            }
          }
        }
      ]
    }).compileComponents();
  });

  it('renders the login form when there is no cached token', () => {
    const fixture = TestBed.createComponent(FormLoginPageComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.Form__Login')).not.toBeNull();
    expect(compiled.querySelector('.Form__Authenticated')).toBeNull();
  });

  it('shows the authenticated state when a token already exists', () => {
    sessionStorage.setItem('form_access_token', 'test-token');

    const fixture = TestBed.createComponent(FormLoginPageComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.Form__Authenticated')?.textContent).toContain('Authenticated');
  });
});
