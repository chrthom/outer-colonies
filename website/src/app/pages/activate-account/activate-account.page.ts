import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import AuthApiService from 'src/app/api/auth-api.service';

@Component({
    selector: 'oc-page-activate-account',
    templateUrl: './activate-account.page.html',
    styleUrls: ['./activate-account.page.scss'],
    standalone: false
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
