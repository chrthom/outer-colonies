import { Component, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatDialogContent, MatDialogActions, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatButton, MatAnchor } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { ContentBoxComponent } from '../../../components/content-box/content-box.component';

@Component({
  selector: 'oc-page-imprint',
  templateUrl: './imprint.page.html',
  styleUrls: ['./imprint.page.scss'],
  imports: [
    CdkScrollable,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatAnchor,
    MatDialogClose,
    NgTemplateOutlet,
    RouterLink,
    ContentBoxComponent
  ]
})
export class ImprintPage {
  protected readonly isDialog = !!inject(MatDialogRef, { optional: true });
}
