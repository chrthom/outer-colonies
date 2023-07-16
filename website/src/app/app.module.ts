import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomePage } from './pages/home/home.page';
import { LoginPage } from './pages/login/login.page';
import { HttpClientModule } from '@angular/common/http';
import { ContentBoxComponent } from './components/content-box/content-box.component';
import { RegisterPage } from './pages/register/register.page';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { NavbarComponent } from './components/navbar/navbar.component';
import { DeckPage } from './pages/deck/deck.page';
import { ImprintPage } from './pages/imprint/imprint.page';
import { DataPrivacyPage } from './pages/data-privacy/data-privacy.page';
import { TradePage } from './pages/trade/trade.page';

@NgModule({
  declarations: [
    AppComponent,
    HomePage,
    LoginPage,
    ContentBoxComponent,
    RegisterPage,
    NavbarComponent,
    DeckPage,
    ImprintPage,
    DataPrivacyPage,
    TradePage,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatCardModule,
    MatBadgeModule,
    MatTabsModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
