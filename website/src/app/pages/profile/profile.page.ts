import { Component } from '@angular/core';
import AuthApiService from 'src/app/api/auth-api.service';

@Component({
  selector: 'oc-page-profile',
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss'
})
export class ProfilePage {
  constructor(private authAPIService: AuthApiService) {}
}
