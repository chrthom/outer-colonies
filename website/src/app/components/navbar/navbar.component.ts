import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import AuthService from 'src/app/auth.service';
import { environment } from 'src/environments/environment';
import { MatTooltip } from '@angular/material/tooltip';
import { MatAnchor } from '@angular/material/button';
import { PlasmaConduitController } from './plasma-conduit';

@Component({
  selector: 'oc-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss', './navbar-mobile.scss'],
  imports: [RouterLink, MatTooltip, MatAnchor]
})
export class NavbarComponent implements AfterViewInit, OnDestroy {
  router = inject(Router);
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  @ViewChild('barElement') private barElement?: ElementRef<HTMLDivElement>;
  @ViewChild('energyCanvas') private energyCanvas?: ElementRef<HTMLCanvasElement>;

  private conduit: PlasmaConduitController | null = null;
  private pointerInside = false;

  private readonly handleMouseMove = (event: MouseEvent): void => {
    this.pointerInside = true;
    this.conduit?.setPointer(event.clientX, event.clientY);
  };

  private readonly handleMouseLeave = (): void => {
    this.pointerInside = false;
    this.conduit?.clearTarget();
  };

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    let isFocusVisible = false;
    try {
      isFocusVisible = target.matches(':focus-visible');
    } catch {
      if (environment.stage !== 'production') {
        console.warn(
          'NavbarComponent: :focus-visible selector unsupported, skipping conduit focus deflection'
        );
      }
      isFocusVisible = false;
    }
    if (!isFocusVisible) {
      return;
    }
    const barRect = this.barElement?.nativeElement.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    if (!barRect || barRect.width <= 0) {
      return;
    }
    const localX = targetRect.left + targetRect.width * 0.5 - barRect.left;
    const localY = targetRect.top + targetRect.height * 0.5 - barRect.top;
    this.conduit?.setLocalTarget(localX, localY);
  };

  private readonly handleFocusOut = (event: FocusEvent): void => {
    const bar = this.barElement?.nativeElement;
    const related = event.relatedTarget;
    if (this.pointerInside || (bar && related instanceof Node && bar.contains(related))) {
      return;
    }
    this.conduit?.clearTarget();
  };

  /** Initializes the header plasma conduit stream outside Angular's change-detection zone. */
  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const bar = this.barElement?.nativeElement;
    const canvas = this.energyCanvas?.nativeElement;
    if (!bar || !canvas) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.conduit = new PlasmaConduitController(canvas, bar);
      this.conduit.start();
      bar.addEventListener('mousemove', this.handleMouseMove, { passive: true });
      bar.addEventListener('mouseleave', this.handleMouseLeave, { passive: true });
      bar.addEventListener('focusin', this.handleFocusIn);
      bar.addEventListener('focusout', this.handleFocusOut);
    });
  }

  /** Releases the animation loop, observers, and DOM listeners on teardown. */
  ngOnDestroy(): void {
    const bar = this.barElement?.nativeElement;
    if (bar) {
      bar.removeEventListener('mousemove', this.handleMouseMove);
      bar.removeEventListener('mouseleave', this.handleMouseLeave);
      bar.removeEventListener('focusin', this.handleFocusIn);
      bar.removeEventListener('focusout', this.handleFocusOut);
    }
    this.conduit?.destroy();
    this.conduit = null;
  }

  /** Whether a user is logged in (icon navbar) or the public auth actions should be shown. */
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }
  get active(): string {
    return this.router.url.split(/[?#]/, 1)[0].replace(/^\/+/, '').split('/')[0];
  }
  get username(): string | undefined {
    return this.authService.displayname;
  }
  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
