import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import AuthApiService from 'src/app/api/auth-api.service';
import { ContentBoxComponent } from '../../components/content-box/content-box.component';

@Component({
    selector: 'oc-page-activate-account',
    templateUrl: './activate-account.page.html',
    styleUrls: ['./activate-account.page.scss'],
    imports: [ContentBoxComponent, RouterLink]
})
export class ActivateAccountPage implements OnInit {
  activationSuccessful = false;
  activationFailed = false;
  constructor(
    private authAPIService: AuthApiService,
    private route: ActivatedRoute
  ) {}
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.authAPIService.activate(params.get('id')!).subscribe({
        next: () => (this.activationSuccessful = true),
        error: () => (this.activationFailed = true)
      });
    });
  }
}
