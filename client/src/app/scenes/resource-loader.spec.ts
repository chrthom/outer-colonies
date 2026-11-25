import Phaser from 'phaser';
import { environment } from '../../environments/environment';
import {
  assetBaseURL,
  loadCardResources,
  loadPreloadableResources,
  loadRequiredResources
} from './resource-loader';

describe('resource-loader', () => {
  const originalAssetsUrl = environment.urls.assets;
  const originalApiUrl = environment.urls.api;

  afterEach(() => {
    environment.urls.assets = originalAssetsUrl;
    environment.urls.api = originalApiUrl;
  });

  describe('assetBaseURL', () => {
    it('returns the configured asset host without trailing slash when set', () => {
      environment.urls.assets = 'https://assets.staging.outercolonies.de';
      environment.urls.api = 'https://api.staging.outercolonies.de';

      expect(assetBaseURL()).toBe('https://assets.staging.outercolonies.de');
    });

    it('falls back to the API /assets proxy when urls.assets is empty', () => {
      environment.urls.assets = '';
      environment.urls.api = 'http://localhost:3000';

      expect(assetBaseURL()).toBe('http://localhost:3000/assets');
    });
  });

  describe('loaders', () => {
    let loaderStub: { baseURL: string; image: jasmine.Spy };

    beforeEach(() => {
      loaderStub = {
        baseURL: '',
        image: jasmine.createSpy('load.image')
      };
    });

    it('sets load.baseURL with trailing slash in loadRequiredResources', () => {
      environment.urls.assets = 'https://assets.outercolonies.de';

      loadRequiredResources(loaderStub as unknown as Phaser.Loader.LoaderPlugin);

      expect(loaderStub.baseURL).toBe('https://assets.outercolonies.de/');
      expect(loaderStub.image).toHaveBeenCalledWith('icon_exit', 'icons/exit.png');
    });

    it('sets load.baseURL with trailing slash in loadPreloadableResources', () => {
      environment.urls.assets = '';
      environment.urls.api = 'http://localhost:3000';

      loadPreloadableResources(loaderStub as unknown as Phaser.Loader.LoaderPlugin);

      expect(loaderStub.baseURL).toBe('http://localhost:3000/assets/');
      expect(loaderStub.image).toHaveBeenCalledWith('prompt_box', 'utils/prompt_box.png');
    });

    it('sets load.baseURL and loads base and requested cards in loadCardResources', () => {
      environment.urls.assets = 'https://assets.staging.outercolonies.de';

      loadCardResources(loaderStub as unknown as Phaser.Loader.LoaderPlugin, [101, 202]);

      expect(loaderStub.baseURL).toBe('https://assets.staging.outercolonies.de/');
      expect(loaderStub.image.calls.allArgs()).toEqual([
        ['card_0', 'cards/0.png'],
        ['card_1', 'cards/1.png'],
        ['card_101', 'cards/101.png'],
        ['card_202', 'cards/202.png']
      ]);
    });
  });
});
