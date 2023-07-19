import { HttpClient } from "@angular/common/http";
import AuthService from "../auth.service";
import OCApi from "./api";

export default class OCApiWithAuth extends OCApi {
  constructor(private authService: AuthService, http: HttpClient) {
    super(http)
  }
  protected get token(): string {
    return this.authService.sessionToken ? this.authService.sessionToken : '';
  }
}