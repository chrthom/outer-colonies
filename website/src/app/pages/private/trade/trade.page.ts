import { Component, OnInit, inject } from '@angular/core';
import { ItemApiService } from 'src/app/api/item-api.service';
import { ProfileApiService } from 'src/app/api/profile-api.service';
import { ApiError } from 'src/app/api/api-error';
import { ItemListResponseBooster, ItemListResponseBox } from '@shared/interfaces/rest_api';
import { environment } from 'src/environments/environment';
import { rules } from '@shared/config/rules';
import { editions } from '@shared/config/editions';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ContentBoxComponent } from '../../../components/content-box/content-box.component';
import { InventoryItemComponent } from '../../../components/inventory-item/inventory-item.component';
import {
  MatCard,
  MatCardHeader,
  MatCardTitle,
  MatCardSubtitle,
  MatCardContent,
  MatCardActions
} from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { OpenItemComponent } from '../../../components/open-item/open-item.component';
import { BoosterOpeningComponent } from '../../../components/booster-opening/booster-opening.component';

/** Active booster opening session payload handed to the unboxing stage. */
export interface OpenedBoosterSession {
  boosterNo: number;
  content: ItemListResponseBox;
}

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
    OpenItemComponent,
    BoosterOpeningComponent
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
  openedBooster?: OpenedBoosterSession;
  openingItemId?: number;
  loadFailed = false;
  actionFailed = false;
  readonly assetURL = environment.url.assets;
  // Editions without a booster price in the rules config are not offered,
  // so a newly added edition needs a matching boosterCosts entry to become purchasable.
  readonly availableBoosters = Object.entries(editions)
    .map(([no, title]) => {
      const editionNo = Number(no);
      return { no: editionNo, title, price: rules.boosterCosts[editionNo] };
    })
    .filter(booster => booster.price != undefined);
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
  /** Returns the localized edition name for a booster pack number. */
  boosterTitle(boosterNo: number): string {
    return editions[boosterNo] ?? `Booster ${boosterNo}`;
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
        error: (err: ApiError) => {
          this.actionFailed = true;
          // The API responds 400 with 'Insufficient sol' when the balance is
          // too low for the purchase (see the booster route in
          // server/src/components/rest_api/shop_router.ts).
          this.snackBar.open(
            err.status == 400
              ? 'Du hast nicht genug Sol für diesen Kauf.'
              : 'Der Kauf konnte nicht abgeschlossen werden. Bitte versuche es später erneut.',
            'OK',
            { duration: 5000 }
          );
        }
      });
    }
  }
  /**
   * Opens an inventory box or booster pack on the server.
   * When `boosterNo` is supplied, opens the physical card-by-card booster unboxing stage.
   */
  open(itemId: number, boosterNo?: number) {
    if (
      this.openingItemId !== undefined ||
      this.openedBooster !== undefined ||
      this.openedBoxContent !== undefined
    ) {
      return;
    }
    this.actionFailed = false;
    this.openingItemId = itemId;
    this.itemApiService.open(itemId).subscribe({
      next: content => {
        this.openingItemId = undefined;
        this.reload();
        if (boosterNo !== undefined && content.cards.length > 0) {
          this.openedBooster = { boosterNo, content };
        } else {
          this.openedBoxContent = content;
        }
      },
      error: () => {
        this.openingItemId = undefined;
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
  /** Closes the booster unboxing stage. */
  boosterClosed() {
    this.openedBooster = undefined;
  }
}
