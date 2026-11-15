import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatAnchor } from '@angular/material/button';
import { ContentBoxComponent } from '../../components/content-box/content-box.component';

/**
 * Public lore page "Die Geschichte": vertical timeline from the devastation of Terra
 * to the present day of ~2250, closing with a registration CTA.
 */
@Component({
  selector: 'oc-page-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  imports: [RouterLink, MatAnchor, ContentBoxComponent]
})
export class HistoryPage {}
