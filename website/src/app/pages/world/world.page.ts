import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentBoxComponent } from '../../components/content-box/content-box.component';
import { QuoteComponent } from '../../components/quote/quote.component';

/**
 * Public lore page "Die Welt": canon intro of the Outer Colonies universe with distributed figure quotes.
 */
@Component({
  selector: 'oc-page-world',
  templateUrl: './world.page.html',
  styleUrls: ['./world.page.scss'],
  imports: [RouterLink, ContentBoxComponent, QuoteComponent]
})
export class WorldPage {}
