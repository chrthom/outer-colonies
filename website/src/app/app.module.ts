import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomePage } from './pages/home/home.page';
import { LoginPage } from './pages/login/login.page';
import { HttpClientModule } from '@angular/common/http';
import { ContentBoxComponent } from './components/content-box/content-box.component';

@NgModule({
  declarations: [
    AppComponent,
    HomePage,
    LoginPage,
    ContentBoxComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
