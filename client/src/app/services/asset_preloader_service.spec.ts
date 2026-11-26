import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import {
  AssetPreloaderService,
  IMAGE_LOADER,
  ImageLoaderFn,
  TextureTarget,
  assetBaseURL
} from './asset_preloader_service';

describe('AssetPreloaderService', () => {
  const originalAssetsUrl = environment.urls.assets;
  const originalApiUrl = environment.urls.api;

  afterEach(() => {
    environment.urls.assets = originalAssetsUrl;
    environment.urls.api = originalApiUrl;
  });

  describe('assetBaseURL', () => {
    it('returns the configured asset host without trailing slash across staging and production', () => {
      environment.urls.assets = 'https://assets.staging.outercolonies.de';
      environment.urls.api = 'https://api.staging.outercolonies.de';
      expect(assetBaseURL()).toBe('https://assets.staging.outercolonies.de');

      environment.urls.assets = 'https://assets.outercolonies.de';
      environment.urls.api = 'https://api.outercolonies.de';
      expect(assetBaseURL()).toBe('https://assets.outercolonies.de');
    });

    it('falls back to the API /assets proxy when urls.assets is empty in development', () => {
      environment.urls.assets = '';
      environment.urls.api = 'http://localhost:3000';

      expect(assetBaseURL()).toBe('http://localhost:3000/assets');
    });
  });

  describe('preloading and Phaser texture registration', () => {
    let loadedUrls: string[];
    let deferredResolvers: Array<{ url: string; resolve: (img: HTMLImageElement | undefined) => void }>;
    let service: AssetPreloaderService;

    const fakeImage = (url: string): HTMLImageElement => ({ src: url }) as unknown as HTMLImageElement;

    const setupService = (loader: ImageLoaderFn): AssetPreloaderService => {
      TestBed.configureTestingModule({
        providers: [AssetPreloaderService, { provide: IMAGE_LOADER, useValue: loader }]
      });
      return TestBed.inject(AssetPreloaderService);
    };

    beforeEach(() => {
      loadedUrls = [];
      deferredResolvers = [];
    });

    it('resolves asset URLs for DOM components using assetBaseURL()', () => {
      environment.urls.assets = '';
      environment.urls.api = 'http://localhost:3000';
      service = setupService(async url => fakeImage(url));

      expect(service.getCardImageUrl(101)).toBe('http://localhost:3000/assets/cards/101.png');
      expect(service.getIconUrl('mission')).toBe('http://localhost:3000/assets/icons/mission.png');
      expect(service.getButtonUrl('active_build')).toBe(
        'http://localhost:3000/assets/utils/button_active_build.png'
      );
      expect(service.getRangeIndicatorUrl(3)).toBe('http://localhost:3000/assets/utils/range3.png');
      expect(service.getPromptBoxUrl()).toBe('http://localhost:3000/assets/utils/prompt_box.png');
      expect(service.getGameOverImageUrl(true)).toBe(
        'http://localhost:3000/assets/utils/game_over_victory.png'
      );
      expect(service.getGameOverImageUrl(false)).toBe(
        'http://localhost:3000/assets/utils/game_over_defeat.png'
      );
    });

    it('preloads required matchmaking assets and registers them in Phaser textures', async () => {
      environment.urls.assets = 'https://assets.outercolonies.de';
      service = setupService(async url => {
        loadedUrls.push(url);
        return fakeImage(url);
      });

      await service.preloadRequired();

      expect(
        loadedUrls.some(u => u.startsWith('https://assets.outercolonies.de/background/stars'))
      ).toBeTrue();
      expect(loadedUrls).toContain('https://assets.outercolonies.de/icons/exit.png');
      expect(loadedUrls).toContain('https://assets.outercolonies.de/background/sun.png');

      const existing = new Set<string>(['background_sun']);
      const textures: TextureTarget = {
        exists: jasmine.createSpy('textures.exists').and.callFake((key: string) => existing.has(key)),
        addImage: jasmine.createSpy('textures.addImage')
      };

      service.registerPhaserTextures(textures);

      expect(textures.addImage).toHaveBeenCalledWith('background', jasmine.any(Object));
      expect(textures.addImage).toHaveBeenCalledWith('icon_exit', jasmine.any(Object));
      expect(textures.addImage).not.toHaveBeenCalledWith('background_sun', jasmine.any(Object));
    });

    it('tracks incremental progress and deduplicates card IDs in preloadMatch()', async () => {
      environment.urls.assets = 'https://assets.staging.outercolonies.de';
      service = setupService(
        url =>
          new Promise(resolve => {
            loadedUrls.push(url);
            deferredResolvers.push({ url, resolve });
          })
      );

      const progressHistory: number[] = [];
      service.progress$.subscribe(p => progressHistory.push(p));

      const matchPromise = service.preloadMatch([101, 101, 202]);

      expect(service.isComplete).toBeFalse();
      expect(loadedUrls).toContain('https://assets.staging.outercolonies.de/cards/0.png');
      expect(loadedUrls).toContain('https://assets.staging.outercolonies.de/cards/1.png');
      expect(loadedUrls).toContain('https://assets.staging.outercolonies.de/cards/101.png');
      expect(loadedUrls).toContain('https://assets.staging.outercolonies.de/cards/202.png');
      expect(loadedUrls.filter(u => u.endsWith('/cards/101.png')).length).toBe(1);

      deferredResolvers.forEach(entry => entry.resolve(fakeImage(entry.url)));
      await matchPromise;

      expect(service.progress).toBe(1);
      expect(service.isComplete).toBeTrue();
      expect(progressHistory[0]).toBe(0);
      expect(progressHistory[progressHistory.length - 1]).toBe(1);
    });

    it('degrades gracefully without hanging if an asset fails to load', async () => {
      environment.urls.assets = 'https://assets.outercolonies.de';
      service = setupService(async url => (url.endsWith('/cards/999.png') ? undefined : fakeImage(url)));

      await service.preloadMatch([999]);

      expect(service.progress).toBe(1);
      expect(service.isComplete).toBeTrue();
    });

    it('reuses cached images across repeated preloads for the same URL', async () => {
      environment.urls.assets = 'https://assets.outercolonies.de';
      service = setupService(async url => {
        loadedUrls.push(url);
        return fakeImage(url);
      });

      await service.preloadMatch([42]);
      const firstCount = loadedUrls.length;
      await service.preloadMatch([42]);

      expect(loadedUrls.length).toBe(firstCount);
    });
  });
});
