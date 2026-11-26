import { TestBed } from '@angular/core/testing';
import { GameResultType } from '@shared/config/enums';
import { ClientState, emptyClientState } from '@shared/interfaces/client_state';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { IMAGE_LOADER } from '../services/asset_preloader_service';
import { GameInteractionService } from '../services/game_interaction_service';
import { GameSessionService } from '../services/game_session_service';
import { MatchmakingService } from '../services/matchmaking_service';
import { NavigationService } from '../services/navigation_service';
import { SchedulerService } from '../services/scheduler_service';
import { CountdownEvent, MatchmakingEvent, SocketService } from '../socket_service';
import { ExitButtonComponent } from './exit_button.component';

class MockSocketService {
  readonly connect$ = new Subject<void>();
  readonly disconnect$ = new Subject<void>();
  readonly connectError$ = new Subject<void>();
  readonly reconnectFailed$ = new Subject<void>();
  readonly matchmaking$ = new Subject<MatchmakingEvent>();
  readonly onlineCount$ = new Subject<number>();
  readonly state$ = new Subject<ClientState>();
  readonly countdown$ = new Subject<CountdownEvent>();
  connect = jasmine.createSpy('connect');
  disconnect = jasmine.createSpy('disconnect');
  disableReconnection = jasmine.createSpy('disableReconnection');
  emitLogin = jasmine.createSpy('emitLogin');
  emitReady = jasmine.createSpy('emitReady');
  emitSurrender = jasmine.createSpy('emitSurrender');
}

describe('ExitButtonComponent', () => {
  let socket: MockSocketService;
  let navigation: { navigateTo: jasmine.Spy };
  let matchmaking: MatchmakingService;
  let session: GameSessionService;
  let interaction: GameInteractionService;

  beforeEach(async () => {
    socket = new MockSocketService();
    navigation = { navigateTo: jasmine.createSpy('navigateTo') };

    await TestBed.configureTestingModule({
      imports: [ExitButtonComponent],
      providers: [
        { provide: SocketService, useValue: socket },
        { provide: NavigationService, useValue: navigation },
        {
          provide: SchedulerService,
          useValue: { schedule: (_d: number, cb: () => void) => (cb(), () => {}) }
        },
        { provide: IMAGE_LOADER, useValue: async () => undefined }
      ]
    }).compileComponents();

    matchmaking = TestBed.inject(MatchmakingService);
    session = TestBed.inject(GameSessionService);
    interaction = TestBed.inject(GameInteractionService);
  });

  afterEach(() => {
    matchmaking.stop();
    session.stopSession();
  });

  it('cancels search and navigates to website in matchmaking mode', () => {
    matchmaking.start('?token=t1');
    const fixture = TestBed.createComponent(ExitButtonComponent);
    fixture.componentInstance.mode = 'matchmaking';
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector('.exit-button') as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('Spielersuche abbrechen');

    button.click();

    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    expect(navigation.navigateTo).toHaveBeenCalledWith(environment.urls.website);
  });

  it('requires inline confirmation before surrendering an active match', () => {
    session.initMatch({ preloadCardIds: [] });
    session.applyState({ ...emptyClientState });
    const fixture = TestBed.createComponent(ExitButtonComponent);
    fixture.componentInstance.mode = 'game';
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const primary = el.querySelector('.exit-button') as HTMLButtonElement;
    expect(primary.textContent?.trim()).toBe('Aufgeben');
    expect(el.querySelector('.confirm-button')).toBeNull();

    primary.click();
    fixture.detectChanges();

    const confirm = el.querySelector('.confirm-button') as HTMLButtonElement;
    expect(confirm).not.toBeNull();
    expect(confirm.textContent?.trim()).toBe('Kapitulation bestätigen');
    expect(socket.emitSurrender).not.toHaveBeenCalled();

    confirm.click();
    fixture.detectChanges();

    expect(socket.emitSurrender).toHaveBeenCalledTimes(1);
    expect(el.querySelector('.confirm-button')).toBeNull();
  });

  it('leaves the match directly without confirmation after game over or connection loss', () => {
    session.initMatch({ preloadCardIds: [] });
    session.applyState({
      ...emptyClientState,
      gameResult: { won: true, type: GameResultType.Domination, sol: 50 }
    });
    const fixture = TestBed.createComponent(ExitButtonComponent);
    fixture.componentInstance.mode = 'game';
    fixture.detectChanges();

    const primary = (fixture.nativeElement as HTMLElement).querySelector('.exit-button') as HTMLButtonElement;
    expect(primary.textContent?.trim()).toBe('Spiel beenden');

    primary.click();

    expect(socket.emitSurrender).not.toHaveBeenCalled();
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    expect(navigation.navigateTo).toHaveBeenCalledWith(environment.urls.website);
  });

  it('hides in game mode while a prompt is visible and stays visible after game over', () => {
    session.initMatch({ preloadCardIds: [] });
    session.applyState({ ...emptyClientState, playerPendingAction: true });
    const fixture = TestBed.createComponent(ExitButtonComponent);
    fixture.componentInstance.mode = 'game';
    fixture.detectChanges();

    interaction.setContinueHover(true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.exit-button')).toBeNull();

    interaction.setContinueHover(false);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.exit-button')).not.toBeNull();
  });

  it('resets inline surrender confirmation when a prompt opens or a new state arrives', () => {
    session.initMatch({ preloadCardIds: [] });
    session.applyState({ ...emptyClientState, playerPendingAction: true });
    const fixture = TestBed.createComponent(ExitButtonComponent);
    fixture.componentInstance.mode = 'game';
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    (el.querySelector('.exit-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.confirm-button')).not.toBeNull();

    interaction.setContinueHover(true);
    fixture.detectChanges();
    interaction.setContinueHover(false);
    fixture.detectChanges();
    expect(el.querySelector('.confirm-button')).toBeNull();

    (el.querySelector('.exit-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.confirm-button')).not.toBeNull();

    session.applyState({ ...emptyClientState, playerPendingAction: true });
    fixture.detectChanges();
    expect(el.querySelector('.confirm-button')).toBeNull();
  });
});
