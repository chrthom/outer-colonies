import { Component, Input } from '@angular/core';

/**
 * Presentational figure quote used as narrative insert on the public lore pages:
 * italic quote text with a teal left border and a Mono Caps attribution line.
 */
@Component({
  selector: 'oc-quote',
  templateUrl: './quote.component.html',
  styleUrls: ['./quote.component.scss']
})
export class QuoteComponent {
  @Input() text = '';
  @Input() author = '';
  @Input() role = '';

  /** Attribution line combining author and optional role, e.g. "Aygül Demir, Solare Kommission". */
  get attribution(): string {
    return this.role ? `${this.author}, ${this.role}` : this.author;
  }
}
