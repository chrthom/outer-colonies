import Matchmaking from './matchmaking';
import { MsgTypeInbound, MsgTypeOutbound } from '../../../../server/src/shared/config/enums';
import { environment } from '../../environments/environment';

describe('Matchmaking Scene', () => {
  let matchmaking: Matchmaking;
  let mockSocket: any;
  let mockLoad: any;
  let mockSceneManager: any;

  beforeEach(() => {
    // Mock Phaser scene methods
    mockLoad = {
      on: jasmine.createSpy('load.on'),
      // Add other load methods as needed
    };

    mockSceneManager = {
      start: jasmine.createSpy('scene.start')
    };

    // Mock Socket.IO
    mockSocket = {
      on: jasmine.createSpy('socket.on').and.callFake((event: string, callback: Function) => {
        // Store callbacks for testing
        if (!mockSocket._callbacks) mockSocket._callbacks = {};
        mockSocket._callbacks[event] = callback;
        return mockSocket; // Allow chaining
      }),
      emit: jasmine.createSpy('socket.emit'),
      off: jasmine.createSpy('socket.off')
    };

    // Create matchmaking scene with mocked Phaser methods
    matchmaking = new Matchmaking();
    
    // Mock the Phaser scene properties
    (matchmaking as any).load = mockLoad;
    (matchmaking as any).scene = mockSceneManager;
    (matchmaking as any).add = {
      // Mock add methods as needed
    };
  });

  it('should create matchmaking scene with correct key', () => {
    expect(matchmaking).toBeTruthy();
    expect((matchmaking as any).sys.settings.key).toBe('Matchmaking');
  });

  it('should load required resources in preload', () => {
    // Mock the loadRequiredResources function
    spyOn<any>(matchmaking, 'loadRequiredResources');
    
    matchmaking.preload();
    
    expect(matchmaking['loadRequiredResources']).toHaveBeenCalledWith(
      environment.urls.api,
      matchmaking.load
    );
  });

  it('should extract session token from URL in create', () => {
    // Mock window.location
    spyOnProperty(window.location, 'search').and.returnValue('?test-session-token');
    
    // Mock component creation methods
    spyOn<any>(matchmaking, 'loadRequiredResources');
    
    matchmaking.create();
    
    expect(matchmaking.sessionToken).toBe('test-session-token');
  });

  it('should handle empty session token gracefully', () => {
    spyOnProperty(window.location, 'search').and.returnValue('');
    spyOn<any>(matchmaking, 'loadRequiredResources');
    
    matchmaking.create();
    
    expect(matchmaking.sessionToken).toBe('');
  });

  it('should connect socket and set up event handlers', () => {
    // Mock socket.io connection
    spyOn(io, 'connect').and.returnValue(mockSocket);
    spyOnProperty(window.location, 'search').and.returnValue('?test-token');
    
    matchmaking.create();
    
    // Verify socket connection
    expect(io.connect).toHaveBeenCalledWith(environment.urls.api);
    
    // Verify event handlers are set up
    expect(mockSocket.on).toHaveBeenCalledWith(MsgTypeOutbound.Connect, jasmine.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(MsgTypeOutbound.Matchmaking, jasmine.any(Function));
  });

  it('should handle Connect event and emit Login', () => {
    spyOn(io, 'connect').and.returnValue(mockSocket);
    spyOnProperty(window.location, 'search').and.returnValue('?test-session-token');
    
    matchmaking.create();
    
    // Get the Connect callback
    const connectCallback = mockSocket._callbacks[MsgTypeOutbound.Connect];
    
    // Simulate Connect event
    connectCallback();
    
    // Verify Login was emitted with session token
    expect(mockSocket.emit).toHaveBeenCalledWith(MsgTypeInbound.Login, 'test-session-token');
  });

  it('should handle Matchmaking search status', () => {
    spyOn(io, 'connect').and.returnValue(mockSocket);
    spyOnProperty(window.location, 'search').and.returnValue('?test-token');
    
    // Mock LoadingStatus
    const mockStatus = {
      setText: jasmine.createSpy('setText')
    };
    spyOn<any>(window, 'LoadingStatus').and.returnValue(mockStatus);
    
    matchmaking.create();
    
    // Get the Matchmaking callback
    const matchmakingCallback = mockSocket._callbacks[MsgTypeOutbound.Matchmaking];
    
    // Simulate Matchmaking search event
    matchmakingCallback('search', {});
    
    // Verify status text was updated
    expect(mockStatus.setText).toHaveBeenCalledWith('Suche Mitspieler...');
  });

  it('should handle Matchmaking start status and transition to Game scene', () => {
    spyOn(io, 'connect').and.returnValue(mockSocket);
    spyOnProperty(window.location, 'search').and.returnValue('?test-token');
    
    matchmaking.create();
    
    // Get the Matchmaking callback
    const matchmakingCallback = mockSocket._callbacks[MsgTypeOutbound.Matchmaking];
    const mockGameParams = { difficulty: 'normal', map: 'standard' };
    
    // Simulate Matchmaking start event
    matchmakingCallback('start', mockGameParams);
    
    // Verify event handlers are removed
    expect(mockSocket.off).toHaveBeenCalledWith(MsgTypeOutbound.Connect);
    expect(mockSocket.off).toHaveBeenCalledWith(MsgTypeOutbound.Matchmaking);
    
    // Verify scene transition
    expect(mockSceneManager.start).toHaveBeenCalledWith('Game', {
      socket: mockSocket,
      gameParams: mockGameParams
    });
  });

  it('should create UI components in create', () => {
    spyOn(io, 'connect').and.returnValue(mockSocket);
    spyOnProperty(window.location, 'search').and.returnValue('?test-token');
    
    // Mock UI components
    const mockStatus = { setText: jasmine.createSpy('setText') };
    const mockVersionIndicator = {};
    const mockExitButton = {};
    
    spyOn<any>(window, 'LoadingStatus').and.returnValue(mockStatus);
    spyOn<any>(window, 'VersionIndicator').and.returnValue(mockVersionIndicator);
    spyOn<any>(window, 'ExitButton').and.returnValue(mockExitButton);
    
    matchmaking.create();
    
    // Verify UI components were created
    expect(window.LoadingStatus).toHaveBeenCalledWith(matchmaking);
    expect(window.VersionIndicator).toHaveBeenCalledWith(matchmaking);
    expect(window.ExitButton).toHaveBeenCalledWith(matchmaking);
    expect(matchmaking.status).toBe(mockStatus);
  });
});