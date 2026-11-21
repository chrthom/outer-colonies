import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatAnchor } from '@angular/material/button';
import { ContentBoxComponent } from '../../../components/content-box/content-box.component';
import { QuoteComponent } from '../../../components/quote/quote.component';

/**
 * Public lore page "Die Welt": canon intro of the Outer Colonies universe with distributed figure quotes,
 * followed by the system timeline from the devastation of Terra to ~2250 and a registration CTA.
 */
@Component({
  selector: 'oc-page-world',
  templateUrl: './world.page.html',
  styleUrls: ['./world.page.scss'],
  imports: [RouterLink, MatAnchor, ContentBoxComponent, QuoteComponent]
})
export class WorldPage {}
