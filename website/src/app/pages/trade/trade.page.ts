import { Component, OnInit } from '@angular/core';
import { ProfileApiService } from 'src/app/api/profile-api.service';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.page.html',
  styleUrls: ['./trade.page.scss']
})
export class TradePage implements OnInit {
  sol: number = 0;
  constructor(private profileApiService: ProfileApiService) {}
  ngOnInit() {
    this.reload();
  }
  reload() {
    this.profileApiService.profile.subscribe(p => {
      if (p) {
        this.sol = p.sol;
      }
    });
  }
}
