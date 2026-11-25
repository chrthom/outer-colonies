import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { IMAGE_LOADER } from '../services/asset_preloader_service';
import { GameInteractionService } from '../services/game_interaction_service';
import { SchedulerService } from '../services/scheduler_service';
import { CountdownEvent, SocketService } from '../socket_service';
import { ZoomCardComponent } from './zoom_card.component';

class MockSocketService {
  readonly state$ = new Subject();
  readonly countdown$ = new Subject<CountdownEvent>();
  readonly disconnect$ = new Subject<void>();
  disableReconnection = jasmine.createSpy('disableReconnection');
  disconnect = jasmine.createSpy('disconnect');
  emitReady = jasmine.createSpy('emitReady');
}

describe('ZoomCardComponent', () => {
  let interaction: GameInteractionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoomCardComponent],
      providers: [
        { provide: SocketService, useValue: new MockSocketService() },
        { provide: SchedulerService, useValue: { schedule: () => () => {} } },
        { provide: IMAGE_LOADER, useValue: async () => undefined }
      ]
    }).compileComponents();

    interaction = TestBed.inject(GameInteractionService);
  });

  it('shows card preview at clamped stage coordinates and hides on hideZoomCard()', () => {
    const fixture = TestBed.createComponent(ZoomCardComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.zoom-card')).toBeNull();

    interaction.toggleZoomCard(42, 20, 80);
    fixture.detectChanges();

    const container = (fixture.nativeElement as HTMLElement).querySelector('.zoom-card') as HTMLElement;
    const img = container.querySelector('img') as HTMLImageElement;
    expect(container).not.toBeNull();
    expect(img.getAttribute('src')).toContain('cards/42.png');
    expect(parseFloat(container.style.left)).toBeGreaterThan(20);
    expect(parseFloat(container.style.top)).toBeLessThan(80);
    expect(getComputedStyle(container).pointerEvents).toBe('none');

    interaction.hideZoomCard();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.zoom-card')).toBeNull();
  });
});
