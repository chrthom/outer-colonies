import { Component, OnInit } from '@angular/core';
import { ItemApiService } from 'src/app/api/item-api.service';
import { ProfileApiService } from 'src/app/api/profile-api.service';
import { ItemListResponseBooster, ItemListResponseBox } from '../../../../../server/src/components/shared_interfaces/rest_api';
import { environment } from 'src/environments/environment';
import { rules } from '../../../../../server/src/components/config/rules';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.page.html',
  styleUrls: ['./trade.page.scss']
})
export class TradePage implements OnInit {
  sol: number = 0;
  boxes: ItemListResponseBox[] = [];
  boosters: ItemListResponseBooster[] = [];
  readonly assetURL = environment.url.assets;
  readonly availableBoosters = [
    {
      no: 1,
      title: 'Outer Colonies',
      price: rules.boosterCosts[1]
    }
  ]
  constructor(private profileApiService: ProfileApiService, private itemApiService: ItemApiService) {}
  ngOnInit() {
    this.reload();
  }
  reload() {
    this.profileApiService.profile.subscribe(p => {
      if (p) {
        this.sol = p.sol;
      }
    });
    this.itemApiService.items.subscribe(i => {
      if (i) {
        this.boosters = i.boosters;
        this.boxes = i.boxes;
      }
    });
  }
  buyBooster(boosterNo: number) {
    if (this.sol >= rules.boosterCosts[boosterNo]) {
      this.itemApiService.buyBooster(boosterNo).subscribe(_ => this.reload());
    }
  }
  open(itemId: number) {
    this.itemApiService.open(itemId).subscribe(_ => this.reload());
  }
}
