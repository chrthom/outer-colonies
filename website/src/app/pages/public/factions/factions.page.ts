import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatAnchor } from '@angular/material/button';
import { ContentBoxComponent } from '../../../components/content-box/content-box.component';
import { QuoteComponent } from '../../../components/quote/quote.component';

/**
 * Public lore page "Die Mächte": the four powers of the Outer Colonies universe –
 * Terra (incl. Luna & Solare Kommission), Mars, Venus and the Outer Colonies.
 */
@Component({
  selector: 'oc-page-factions',
  templateUrl: './factions.page.html',
  styleUrls: ['./factions.page.scss'],
  imports: [RouterLink, MatAnchor, ContentBoxComponent, QuoteComponent]
})
export class FactionsPage {}
