import { TestBed } from '@angular/core/testing';
import { emptyClientState } from '@shared/interfaces/client_state';
import { Subject } from 'rxjs';
import { AssetPreloaderService, IMAGE_LOADER } from '../services/asset_preloader_service';
import { GameSessionService } from '../services/game_session_service';
import { SchedulerService } from '../services/scheduler_service';
import { CountdownEvent, SocketService } from '../socket_service';
import { PreloaderComponent } from './preloader.component';

class MockSocketService {
  readonly state$ = new Subject();
  readonly countdown$ = new Subject<CountdownEvent>();
  readonly disconnect$ = new Subject<void>();
  disableReconnection = jasmine.createSpy('disableReconnection');
  disconnect = jasmine.createSpy('disconnect');
  emitReady = jasmine.createSpy('emitReady');
}

describe('PreloaderComponent', () => {
  let resolvers: Array<() => void>;
  let session: GameSessionService;
  let assetPreloader: AssetPreloaderService;

  beforeEach(async () => {
    resolvers = [];
    await TestBed.configureTestingModule({
      imports: [PreloaderComponent],
      providers: [
        { provide: SocketService, useValue: new MockSocketService() },
        { provide: SchedulerService, useValue: { schedule: () => () => {} } },
        {
          provide: IMAGE_LOADER,
          useValue: (url: string) =>
            new Promise<HTMLImageElement>(resolve => {
              resolvers.push(() => resolve({ src: url } as unknown as HTMLImageElement));
            })
        }
      ]
    }).compileComponents();

    session = TestBed.inject(GameSessionService);
    assetPreloader = TestBed.inject(AssetPreloaderService);
  });

  afterEach(() => {
    session.stopSession();
  });

  it('shows preload progress, transitions to waiting text on complete, and hides on first state', async () => {
    session.initMatch({ preloadCardIds: [10] });
    const fixture = TestBed.createComponent(PreloaderComponent);
    const loadPromise = assetPreloader.preloadMatch([10]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.status-text')?.textContent?.trim()).toBe('Lade Spieldaten...');
    expect(el.querySelector('.progress-track')).not.toBeNull();

    resolvers.forEach(r => r());
    await loadPromise;
    fixture.detectChanges();

    expect(el.querySelector('.status-text')?.textContent?.trim()).toBe('Warte auf Gegenspieler...');
    expect(el.querySelector('.progress-track')?.getAttribute('aria-valuenow')).toBe('100');

    session.applyState({ ...emptyClientState });
    fixture.detectChanges();

    expect(el.querySelector('.preloader')).toBeNull();
  });

  it('hides immediately if the socket disconnects before the first state arrives', async () => {
    session.initMatch({ preloadCardIds: [] });
    const fixture = TestBed.createComponent(PreloaderComponent);
    const loadPromise = assetPreloader.preloadMatch([]);
    resolvers.forEach(r => r());
    await loadPromise;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.preloader')).not.toBeNull();

    session.handleDisconnect();
    fixture.detectChanges();

    expect(el.querySelector('.preloader')).toBeNull();
  });
});
