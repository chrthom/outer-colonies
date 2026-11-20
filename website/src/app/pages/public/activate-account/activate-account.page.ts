import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import AuthApiService from 'src/app/api/auth-api.service';
import { ContentBoxComponent } from '../../../components/content-box/content-box.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'oc-page-activate-account',
  templateUrl: './activate-account.page.html',
  styleUrls: ['./activate-account.page.scss'],
  imports: [ContentBoxComponent, RouterLink]
})
export class ActivateAccountPage implements OnInit {
  private authAPIService = inject(AuthApiService);
  private route = inject(ActivatedRoute);

  activationSuccessful = false;
  activationFailed = false;
  loading = true;
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.loading = true;
      this.activationSuccessful = false;
      this.activationFailed = false;
      this.authAPIService.activate(params.get('id')!).subscribe({
        next: () => {
          this.activationSuccessful = true;
          this.loading = false;
        },
        error: () => {
          if (environment.stage !== 'production') console.warn('Account activation request failed');
          this.activationFailed = true;
          this.loading = false;
        }
      });
    });
  }
}
