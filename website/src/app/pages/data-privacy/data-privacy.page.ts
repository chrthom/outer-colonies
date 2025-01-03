import { Component } from '@angular/core';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'oc-page-data-privacy',
    templateUrl: './data-privacy.page.html',
    styleUrls: ['./data-privacy.page.scss'],
    imports: [CdkScrollable, MatDialogContent, MatDialogActions, MatButton, MatDialogClose]
})
export class DataPrivacyPage {}
