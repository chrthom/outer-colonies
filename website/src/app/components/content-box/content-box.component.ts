import { Component, Input } from '@angular/core';

/**
 * Visual surface treatment for `oc-content-box`:
 * - `panel`: restrained chamfered technical frame with unified translucent console fill (default)
 * - `brackets`: four fine luminous card-corner brackets over a subtle console tint
 * - `open`: unboxed section sitting directly on `#root-content` with the shared title rule
 */
export type ContentBoxVariant = 'panel' | 'brackets' | 'open';

/**
 * Reusable Flight-Console container providing a family of scalable, seam-free surfaces.
 */
@Component({
  selector: 'oc-content-box',
  templateUrl: './content-box.component.html',
  styleUrls: ['./content-box.component.scss']
})
export class ContentBoxComponent {
  @Input() title = '';
  @Input() variant: ContentBoxVariant = 'panel';
}
