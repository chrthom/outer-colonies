import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authTokenInterceptor } from './app/api/auth-token.interceptor';
import { apiErrorInterceptor } from './app/api/api-error.interceptor';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { AppComponent } from './app/app.component';
import { provideZoneChangeDetection } from '@angular/core';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authTokenInterceptor, apiErrorInterceptor])),
    provideAnimations()
  ]
}).catch(err => console.error(err));
