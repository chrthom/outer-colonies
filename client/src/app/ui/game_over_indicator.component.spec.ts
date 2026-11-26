import { TestBed } from '@angular/core/testing';
import { GameResultType } from '@shared/config/enums';
import { emptyClientState } from '@shared/interfaces/client_state';
import { Subject } from 'rxjs';
import { IMAGE_LOADER } from '../services/asset_preloader_service';
import { GameSessionService } from '../services/game_session_service';
import { SchedulerService } from '../services/scheduler_service';
import { CountdownEvent, SocketService } from '../socket_service';
import { GameOverIndicatorComponent } from './game_over_indicator.component';

class MockSocketService {
  readonly state$ = new Subject();
  readonly countdown$ = new Subject<CountdownEvent>();
  readonly disconnect$ = new Subject<void>();
  disableReconnection = jasmine.createSpy('disableReconnection');
  disconnect = jasmine.createSpy('disconnect');
  emitReady = jasmine.createSpy('emitReady');
}

describe('GameOverIndicatorComponent', () => {
  let session: GameSessionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameOverIndicatorComponent],
      providers: [
        { provide: SocketService, useValue: new MockSocketService() },
        {
          provide: SchedulerService,
          useValue: { schedule: (_d: number, cb: () => void) => (cb(), () => {}) }
        },
        { provide: IMAGE_LOADER, useValue: async () => undefined }
      ]
    }).compileComponents();

    session = TestBed.inject(GameSessionService);
  });

  afterEach(() => {
    session.stopSession();
  });

  it('renders victory banner, reason, and Sol reward without blocking pointer events', () => {
    const fixture = TestBed.createComponent(GameOverIndicatorComponent);
    session.initMatch({ preloadCardIds: [] });
    session.applyState({
      ...emptyClientState,
      gameResult: { won: true, type: GameResultType.Domination, sol: 42 }
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const container = el.querySelector('.game-over-indicator') as HTMLElement;
    expect(container).not.toBeNull();
    expect(getComputedStyle(container).pointerEvents).toBe('none');
    expect(el.querySelector('.title')?.textContent?.trim()).toBe('Sieg');
    expect(el.querySelector('.subtitle')?.textContent?.trim()).toBe('durch Vorherrschaft');
    expect(el.querySelector('.sol-gain')?.textContent?.trim()).toBe('42 Sol erhalten');
    expect(el.querySelector('img')?.getAttribute('src')).toContain('utils/game_over_victory.png');
  });

  it('renders defeat banner and hides Sol reward when sol is 0', () => {
    const fixture = TestBed.createComponent(GameOverIndicatorComponent);
    session.initMatch({ preloadCardIds: [] });
    session.applyState({
      ...emptyClientState,
      gameResult: { won: false, type: GameResultType.Destruction, sol: 0 }
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.title')?.textContent?.trim()).toBe('Niederlage');
    expect(el.querySelector('.subtitle')?.textContent?.trim()).toBe('durch Zerstörung der Kolonie');
    expect(el.querySelector('.sol-gain')).toBeNull();
    expect(el.querySelector('img')?.getAttribute('src')).toContain('utils/game_over_defeat.png');
  });
});
