import { Component, OnInit, inject } from '@angular/core';
import { ItemApiService } from 'src/app/api/item-api.service';
import { ProfileApiService } from 'src/app/api/profile-api.service';
import {
  ItemListResponseBooster,
  ItemListResponseBox
} from '../../../../../server/src/shared/interfaces/rest_api';
import { environment } from 'src/environments/environment';
import { rules } from '../../../../../server/src/shared/config/rules';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ContentBoxComponent } from '../../components/content-box/content-box.component';
import { InventoryItemComponent } from '../../components/inventory-item/inventory-item.component';
import {
  MatCard,
  MatCardHeader,
  MatCardTitle,
  MatCardSubtitle,
  MatCardContent,
  MatCardActions
} from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { OpenItemComponent } from '../../components/open-item/open-item.component';

@Component({
  selector: 'oc-page-trade',
  templateUrl: './trade.page.html',
  styleUrls: ['./trade.page.scss'],
  imports: [
    ContentBoxComponent,
    InventoryItemComponent,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatCardContent,
    MatCardActions,
    MatButton,
    OpenItemComponent
  ]
})
export class TradePage implements OnInit {
  private profileApiService = inject(ProfileApiService);
  private itemApiService = inject(ItemApiService);
  private snackBar = inject(MatSnackBar);

  sol = 0;
  boxes: ItemListResponseBox[] = [];
  boosters: ItemListResponseBooster[] = [];
  openedBoxContent?: ItemListResponseBox;
  loadFailed = false;
  actionFailed = false;
  readonly assetURL = environment.url.assets;
  readonly availableBoosters = [
    {
      no: 1,
      title: 'Outer Colonies',
      price: rules.boosterCosts[1]
    },
    {
      no: 4,
      title: 'Kuipergürtel',
      price: rules.boosterCosts[4]
    },
    {
      no: 2,
      title: 'Jovians Freihändler',
      price: rules.boosterCosts[2]
    },
    {
      no: 3,
      title: 'Marsianische Hegemonie',
      price: rules.boosterCosts[3]
    },
    {
      no: 5,
      title: 'Sichere Häfen',
      price: rules.boosterCosts[5]
    }
  ];
  ngOnInit() {
    this.reload();
  }
  reload() {
    this.loadFailed = false;
    this.profileApiService.profile.subscribe({
      next: p => {
        this.sol = p.sol;
      },
      error: () => (this.loadFailed = true)
    });
    this.itemApiService.items.subscribe({
      next: i => {
        this.boosters = i.boosters;
        this.boxes = i.boxes;
      },
      error: () => (this.loadFailed = true)
    });
  }
  buyBooster(boosterNo: number) {
    if (this.sol >= rules.boosterCosts[boosterNo]) {
      this.actionFailed = false;
      this.itemApiService.buyBooster(boosterNo).subscribe({
        next: () => {
          this.reload();
          const booster = this.availableBoosters.find(b => b.no == boosterNo);
          this.snackBar.open(
            `Du hast ein Booster Pack "${booster?.title}" für ${booster?.price} Sol erworben.`,
            'OK',
            {
              duration: 5000
            }
          );
        },
        error: () => {
          this.actionFailed = true;
          this.snackBar.open(
            'Der Kauf konnte nicht abgeschlossen werden. Bitte versuche es später erneut.',
            'OK',
            { duration: 5000 }
          );
        }
      });
    }
  }
  open(itemId: number) {
    this.actionFailed = false;
    this.itemApiService.open(itemId).subscribe({
      next: content => {
        this.reload();
        this.openedBoxContent = content;
      },
      error: () => {
        this.actionFailed = true;
        this.snackBar.open('Das Item konnte nicht geöffnet werden. Bitte versuche es später erneut.', 'OK', {
          duration: 5000
        });
      }
    });
  }
  boxClosed() {
    this.openedBoxContent = undefined;
    this.reload();
  }
}
