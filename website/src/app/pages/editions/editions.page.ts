import { Component } from '@angular/core';
import { ContentBoxComponent } from '../../components/content-box/content-box.component';

/**
 * Public lore page "Die Editionen": one box per released edition (Ed 1–4) with
 * story arc subtitle, illuminated section of the world and the edition story.
 */
@Component({
  selector: 'oc-page-editions',
  templateUrl: './editions.page.html',
  styleUrls: ['./editions.page.scss'],
  imports: [ContentBoxComponent]
})
export class EditionsPage {}
