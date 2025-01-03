import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import AuthApiService from 'src/app/api/auth-api.service';
import { ContentBoxComponent } from '../../components/content-box/content-box.component';

@Component({
    selector: 'oc-page-confirm-email',
    templateUrl: './confirm-email.page.html',
    styleUrls: ['./confirm-email.page.scss'],
    imports: [ContentBoxComponent, RouterLink]
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
