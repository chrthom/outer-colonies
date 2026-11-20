import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import AuthApiService from 'src/app/api/auth-api.service';
import { ContentBoxComponent } from '../../../components/content-box/content-box.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'oc-page-confirm-email',
  templateUrl: './confirm-email.page.html',
  styleUrls: ['./confirm-email.page.scss'],
  imports: [ContentBoxComponent, RouterLink]
})
export class ConfirmEmailPage implements OnInit {
  private authAPIService = inject(AuthApiService);
  private route = inject(ActivatedRoute);

  confirmationSuccessful = false;
  confirmationFailed = false;
  loading = true;
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.loading = true;
      this.confirmationSuccessful = false;
      this.confirmationFailed = false;
      this.authAPIService.confirmEmail(params.get('id')!).subscribe({
        next: () => {
          this.confirmationSuccessful = true;
          this.loading = false;
        },
        error: () => {
          if (environment.stage !== 'production') console.warn('Email confirmation request failed');
          this.confirmationFailed = true;
          this.loading = false;
        }
      });
    });
  }
}
