import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { ContentBoxComponent } from './components/content-box/content-box.component';
import { ImageModalComponent } from './components/image-modal/image-modal.component';
import { InventoryItemComponent } from './components/inventory-item/inventory-item.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { OpenItemComponent } from './components/open-item/open-item.component';

import { DataPrivacyPage } from './pages/data-privacy/data-privacy.page';
import { DeckPage } from './pages/deck/deck.page';
import { HomePage } from './pages/home/home.page';
import { ImprintPage } from './pages/imprint/imprint.page';
import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';
import { RulesPage } from './pages/rules/rules.page';
import { TradePage } from './pages/trade/trade.page';

@NgModule({
  declarations: [
    AppComponent,
    ContentBoxComponent,
    ImageModalComponent,
    InventoryItemComponent,
    NavbarComponent,
    OpenItemComponent,
    DataPrivacyPage,
    DeckPage,
    HomePage,
    ImprintPage,
    LoginPage,
    RegisterPage,
    RulesPage,
    TradePage
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    MatButtonModule,
    MatBadgeModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatExpansionModule,
    MatInputModule,
    MatListModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatSortModule,
    MatTabsModule,
    MatTooltipModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
