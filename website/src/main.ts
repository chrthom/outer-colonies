import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authTokenInterceptor } from './app/api/auth-token.interceptor';
import { apiErrorInterceptor } from './app/api/api-error.interceptor';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { provideZoneChangeDetection } from '@angular/core';
import { appRouterProviders } from './app/app.routes';
import { initFontLoading } from './app/font-loading';

void initFontLoading();

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    appRouterProviders,
    provideHttpClient(withInterceptors([authTokenInterceptor, apiErrorInterceptor])),
    provideAnimations()
  ]
}).catch(err => console.error(err));
