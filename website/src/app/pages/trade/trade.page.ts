import { Component, OnInit } from '@angular/core';
import { ItemApiService } from 'src/app/api/item-api.service';
import { ProfileApiService } from 'src/app/api/profile-api.service';
import {
  ItemListResponseBooster,
  ItemListResponseBox,
  OpenItemResponse,
} from '../../../../../server/src/components/shared_interfaces/rest_api';
import { environment } from 'src/environments/environment';
import { rules } from '../../../../../server/src/components/config/rules';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.page.html',
  styleUrls: ['./trade.page.scss'],
})
export class TradePage implements OnInit {
  sol: number = 0;
  boxes: ItemListResponseBox[] = [];
  boosters: ItemListResponseBooster[] = [];
  openedBoxContent?: OpenItemResponse;
  readonly assetURL = environment.url.assets;
  readonly availableBoosters = [
    {
      no: 1,
      title: 'Outer Colonies',
      price: rules.boosterCosts[1],
    },
  ];
  constructor(
    private profileApiService: ProfileApiService,
    private itemApiService: ItemApiService,
    private snackBar: MatSnackBar,
  ) {}
  ngOnInit() {
    this.reload();
  }
  reload() {
    this.profileApiService.profile.subscribe((p) => {
      if (p) {
        this.sol = p.sol;
      }
    });
    this.itemApiService.items.subscribe((i) => {
      if (i) {
        this.boosters = i.boosters;
        this.boxes = i.boxes;
      }
    });
  }
  buyBooster(boosterNo: number) {
    if (this.sol >= rules.boosterCosts[boosterNo]) {
      this.itemApiService.buyBooster(boosterNo).subscribe((_) => {
        this.reload();
        const booster = this.availableBoosters.find((b) => b.no == boosterNo);
        this.snackBar.open(
          `Du hast ein Booster Pack "${booster?.title}" für ${booster?.price} Sol erworben.`,
          'OK',
          {
            duration: 5000,
          },
        );
      });
    }
  }
  open(itemId: number) {
    this.itemApiService.open(itemId).subscribe((content) => {
      this.reload()
      this.openedBoxContent = content;
    });
  }
  boxClosed() {
    this.openedBoxContent = undefined;
    this.reload();
  }
}
