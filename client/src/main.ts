import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';

// Test comment with bad formatting

    bootstrapApplication(AppComponent, {
  providers: [importProvidersFrom(BrowserModule),],
}).catch(err=>console.error(err));
