import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import AuthApiService from 'src/app/api/auth-api.service';

@Component({
    selector: 'oc-page-confirm-email',
    templateUrl: './confirm-email.page.html',
    styleUrls: ['./confirm-email.page.scss'],
    standalone: false
})
export class ConfirmEmailPage implements OnInit {
  confirmationSuccessful = false;
  confirmationFailed = false;
  constructor(
    private authAPIService: AuthApiService,
    private route: ActivatedRoute
  ) {}
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.authAPIService.confirmEmail(params.get('id')!).subscribe({
        next: () => (this.confirmationSuccessful = true),
        error: () => (this.confirmationFailed = true)
      });
    });
  }
}
