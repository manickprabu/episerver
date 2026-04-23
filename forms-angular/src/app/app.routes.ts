import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/pages/home-page/home-page.component').then((m) => m.HomePageComponent),
    title: 'Home'
  },
  {
    path: 'forms',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/forms/pages/form-render-page/form-render-page.component').then(
            (m) => m.FormRenderPageComponent
          ),
        title: 'Form',
        data: {
          formKey: '',
          language: 'en',
          baseUrl: '/',
          optiGraphUrl: ''
        }
      },
      {
        path: 'container',
        loadComponent: () =>
          import('./features/forms/pages/form-container-page/form-container-page.component').then(
            (m) => m.FormContainerPageComponent
          ),
        title: 'Form Container'
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/forms/pages/form-login-page/form-login-page.component').then(
            (m) => m.FormLoginPageComponent
          ),
        title: 'Form Login',
        data: {
          clientId: 'TestClient',
          authBaseUrl: ''
        }
      },
      {
        path: 'steps/:stepSlug',
        loadComponent: () =>
          import('./features/forms/pages/form-step-page/form-step-page.component').then(
            (m) => m.FormStepPageComponent
          ),
        title: 'Form Step'
      },
      {
        path: 'sample',
        loadComponent: () =>
          import('./features/forms/pages/sample-form-page/sample-form-page.component').then(
            (m) => m.SampleFormPageComponent
          ),
        title: 'Sample Form'
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
