import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

/**
 * Structured dialog payload for {@link ImageModalComponent}.
 * Plain URL strings remain supported for backward compatibility.
 */
export interface ImageModalData {
  src: string;
  alt?: string;
  title?: string;
}

/**
 * Modal dialog for inspecting a full-size card image with accessible labeling,
 * a keyboard-operable close control and an image load-error fallback.
 */
@Component({
  selector: 'oc-image-modal',
  templateUrl: './image-modal.component.html',
  styleUrls: ['./image-modal.component.scss']
})
export class ImageModalComponent {
  private readonly dialogRef = inject<MatDialogRef<ImageModalComponent> | null>(MatDialogRef, {
    optional: true
  });
  readonly data = inject<string | ImageModalData>(MAT_DIALOG_DATA);
  imageFailed = false;

  /** Resolved image URL regardless of whether a string or structured payload was passed. */
  get imageSrc(): string {
    return typeof this.data === 'string' ? this.data : this.data.src;
  }

  /** Accessible alternative text for the displayed card image. */
  get imageAlt(): string {
    if (typeof this.data === 'string') {
      return 'Kartenansicht';
    }
    return this.data.alt ?? this.data.title ?? 'Kartenansicht';
  }

  /** Optional modal heading displayed above the card image. */
  get title(): string | undefined {
    return typeof this.data === 'string' ? undefined : this.data.title;
  }

  /** Closes the modal dialog. */
  close(): void {
    this.dialogRef?.close();
  }

  /** Marks the card image as unavailable so a readable fallback message is shown. */
  onImageError(): void {
    this.imageFailed = true;
  }
}
