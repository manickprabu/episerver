import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FormLoaderService } from '../../../../core/services/form-loader.service';
import { FormRenderPageComponent } from './form-render-page.component';
import { sampleSupportRequestForm } from '../form-container-page/form-container-page.schema';

describe('FormRenderPageComponent', () => {
  const formLoaderService = {
    loadForm: vi.fn()
  };

  function configureRoute(queryParams: Record<string, string> = {}, data: Record<string, string> = {}) {
    return {
      queryParamMap: of(convertToParamMap(queryParams)),
      snapshot: {
        data: {
          formKey: '',
          language: 'en',
          baseUrl: '/',
          optiGraphUrl: '',
          ...data
        }
      }
    };
  }

  beforeEach(async () => {
    formLoaderService.loadForm.mockReset();

    await TestBed.configureTestingModule({
      imports: [FormRenderPageComponent],
      providers: [
        { provide: FormLoaderService, useValue: formLoaderService },
        {
          provide: ActivatedRoute,
          useValue: configureRoute()
        }
      ]
    }).compileComponents();
  });

  it('shows the missing-form-key guidance when no key is configured', () => {
    const fixture = TestBed.createComponent(FormRenderPageComponent);
    fixture.detectChanges();

    expect(formLoaderService.loadForm).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Missing form key');
  });

  it('loads the form by key and renders the Angular form container', () => {
    formLoaderService.loadForm.mockReturnValue(of(sampleSupportRequestForm));
    TestBed.resetTestingModule();

    return TestBed.configureTestingModule({
      imports: [FormRenderPageComponent],
      providers: [
        { provide: FormLoaderService, useValue: formLoaderService },
        {
          provide: ActivatedRoute,
          useValue: configureRoute({ formKey: 'support-request', baseUrl: 'https://cms.example/' })
        }
      ]
    })
      .compileComponents()
      .then(() => {
        const fixture = TestBed.createComponent(FormRenderPageComponent);
        fixture.detectChanges();

        expect(formLoaderService.loadForm).toHaveBeenCalledWith({
          formKey: 'support-request',
          language: 'en',
          baseUrl: 'https://cms.example/',
          optiGraphUrl: undefined
        });
        expect(fixture.nativeElement.querySelector('.EPiServerForms')).not.toBeNull();
      });
  });

  it('shows the loader error when the request fails', () => {
    formLoaderService.loadForm.mockReturnValue(throwError(() => new Error('boom')));
    TestBed.resetTestingModule();

    return TestBed.configureTestingModule({
      imports: [FormRenderPageComponent],
      providers: [
        { provide: FormLoaderService, useValue: formLoaderService },
        {
          provide: ActivatedRoute,
          useValue: configureRoute({ formKey: 'support-request', baseUrl: 'https://cms.example/' })
        }
      ]
    })
      .compileComponents()
      .then(() => {
        const fixture = TestBed.createComponent(FormRenderPageComponent);
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('boom');
      });
  });
});
