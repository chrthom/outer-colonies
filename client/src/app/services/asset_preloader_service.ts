import { Injectable, InjectionToken, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { backgroundConfig } from '../config/background';

/**
 * Base URL for static asset loading, without trailing slash.
 */
export function assetBaseURL(): string {
  // Local development has no own asset host and keeps using the dev-only proxy of the API server
  return environment.urls.assets || `${environment.urls.api}/assets`;
}

/** Asset entry pairing a logical texture key with its relative asset path. */
export interface AssetEntry {
  key: string;
  path: string;
}

/** Minimal Phaser texture manager contract registered without importing Phaser. */
export interface TextureTarget {
  exists(key: string): boolean;
  addImage(key: string, source: HTMLImageElement): unknown;
}

/** Function signature for browser-native image loading, injectable for unit testing. */
export type ImageLoaderFn = (url: string) => Promise<HTMLImageElement | undefined>;

/** Default browser-native image preloader using `HTMLImageElement`. */
export function defaultImageLoader(url: string): Promise<HTMLImageElement | undefined> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      if (environment.stage !== 'production') {
        console.warn(`Failed to preload asset image: ${url}`);
      }
      resolve(undefined);
    };
    img.src = url;
  });
}

/** Injection token for overriding browser image loading in tests. */
export const IMAGE_LOADER = new InjectionToken<ImageLoaderFn>('IMAGE_LOADER', {
  providedIn: 'root',
  factory: () => defaultImageLoader
});

/**
 * Browser-native asset preloader service replacing `Phaser.Loader` coupling.
 * Preloads background, card, icon, and UI images once into browser cache and
 * exposes loaded `HTMLImageElement` instances for the Phaser board as well as
 * URL helpers for Angular DOM components.
 */
@Injectable({ providedIn: 'root' })
export class AssetPreloaderService {
  private readonly progressSubject = new BehaviorSubject<number>(0);
  private readonly isLoadingSubject = new BehaviorSubject<boolean>(false);
  private readonly isCompleteSubject = new BehaviorSubject<boolean>(false);

  /** Normalized preload progress in `[0, 1]` for the active match preload batch. */
  readonly progress$: Observable<number> = this.progressSubject.asObservable();
  /** Whether a match preload batch is currently in progress. */
  readonly isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  /** Whether the current match preload batch has completed. */
  readonly isComplete$: Observable<boolean> = this.isCompleteSubject.asObservable();

  private readonly loadImage = inject(IMAGE_LOADER);
  private readonly backgroundVariant = Math.floor(Math.random() * 7);
  private readonly inFlight = new Map<string, Promise<HTMLImageElement | undefined>>();
  private readonly loadedImages = new Map<string, { url: string; image: HTMLImageElement }>();
  private matchLoadToken = 0;

  /** Current match preload progress in `[0, 1]`. */
  get progress(): number {
    return this.progressSubject.value;
  }

  /** Whether the latest match preload batch finished. */
  get isComplete(): boolean {
    return this.isCompleteSubject.value;
  }

  /** Resolves a relative asset path against the configured asset host or dev proxy. */
  getAssetUrl(relativePath: string): string {
    return `${assetBaseURL()}/${relativePath}`;
  }

  /** Returns the asset URL for a card image (`cards/<id>.png`). */
  getCardImageUrl(cardId: number): string {
    return this.getAssetUrl(`cards/${cardId}.png`);
  }

  /** Returns the asset URL for a UI or attribute/action icon (`icons/<name>.png`). */
  getIconUrl(iconName: string): string {
    return this.getAssetUrl(`icons/${iconName}.png`);
  }

  /** Returns the asset URL for a continue button state image (`utils/button_<key>.png`). */
  getButtonUrl(buttonKey: string): string {
    return this.getAssetUrl(`utils/button_${buttonKey}.png`);
  }

  /** Returns the asset URL for a combat range badge (`utils/range<range>.png`). */
  getRangeIndicatorUrl(range: number): string {
    return this.getAssetUrl(`utils/range${range}.png`);
  }

  /** Returns the asset URL for the prompt panel background image. */
  getPromptBoxUrl(): string {
    return this.getAssetUrl('utils/prompt_box.png');
  }

  /** Returns the asset URL for the victory or defeat banner image. */
  getGameOverImageUrl(won: boolean): string {
    return this.getAssetUrl(`utils/game_over_${won ? 'victory' : 'defeat'}.png`);
  }

  /** Lists the required assets needed to display the initial matchmaking background. */
  getRequiredEntries(): AssetEntry[] {
    return [
      { key: 'background', path: `background/stars${this.backgroundVariant}.jpg` },
      { key: 'icon_exit', path: 'icons/exit.png' },
      { key: 'background_sun', path: 'background/sun.png' }
    ];
  }

  /** Lists shared background, board, icon, and UI assets preloadable across matches. */
  getCommonEntries(): AssetEntry[] {
    return [
      ...backgroundConfig.orbs.map(o => ({
        key: `background_orb_${o.name}`,
        path: `background/orb_${o.name}.png`
      })),
      ...backgroundConfig.rings.map(name => ({
        key: `background_ring_${name}`,
        path: `background/ring_${name}.png`
      })),
      ...[
        'asteroid1',
        'corvette1',
        'corvette2',
        'corvette3',
        'freighter1',
        'freighter2',
        'freighter3',
        'station1',
        'torpedos1'
      ].map(name => ({ key: `background_vessel_${name}`, path: `background/vessel_${name}.png` })),
      ...[
        'damage',
        'hp',
        'control',
        'speed',
        'energy',
        'theta',
        'xi',
        'phi',
        'omega',
        'delta',
        'psi',
        'armour',
        'shield',
        'point_defense'
      ].map(attribute => ({ key: `attribute_${attribute}`, path: `attribute/${attribute}.png` })),
      ...['mask', 'mask_small', 'glow', 'glow_small', 'pile_1', 'pile_2', 'pile_3', 'pile_4'].map(name => ({
        key: `card_${name}`,
        path: `utils/card_${name}.png`
      })),
      ...['blue', 'red'].map(color => ({
        key: `card_stack_info_box_${color}`,
        path: `utils/card_stack_info_box_${color}.png`
      })),
      ...['red', 'yellow', 'blue', 'white'].map(color => ({
        key: `flare_${color}`,
        path: `utils/flare_${color}.png`
      })),
      ...['defeat', 'victory'].map(gameOver => ({
        key: `game_over_${gameOver}`,
        path: `utils/game_over_${gameOver}.png`
      })),
      ...[
        'equipment',
        'hull',
        'infrastructure',
        'tactic',
        'intelligence',
        'military',
        'science',
        'trade',
        'hull_infrastructure',
        'equipment_hull',
        'equipment_hull_infrastructure',
        'equipment_hull_infrastructure_tactic',
        'retract_card',
        'mission',
        'raid',
        'exit'
      ].map(name => ({ key: `icon_${name}`, path: `icons/${name}.png` })),
      { key: 'prompt_box', path: 'utils/prompt_box.png' },
      ...[1, 2, 3, 4].map(r => ({ key: `range_${r}`, path: `utils/range${r}.png` })),
      { key: 'zone_corner', path: 'utils/zone_corner.png' },
      ...[
        'active_build',
        'active_combat',
        'active_select',
        'active_wait',
        'won',
        'inactive_combat',
        'inactive_select',
        'inactive_wait',
        'lost'
      ].map(name => ({ key: `button_${name}`, path: `utils/button_${name}.png` }))
    ];
  }

  /** Lists card image entries for the base card IDs (`0`, `1`) plus the match-specific IDs. */
  getCardEntries(cardIds: number[]): AssetEntry[] {
    const uniqueIds = Array.from(new Set([0, 1, ...cardIds]));
    return uniqueIds.map(id => ({ key: `card_${id}`, path: `cards/${id}.png` }));
  }

  /** Preloads the minimal background/navigation assets required for matchmaking. */
  async preloadRequired(): Promise<void> {
    await Promise.all(this.getRequiredEntries().map(entry => this.loadEntry(entry)));
  }

  /** Preloads shared game/UI assets in the background without blocking UI rendering. */
  async preloadCommon(): Promise<void> {
    await Promise.all(this.getCommonEntries().map(entry => this.loadEntry(entry)));
  }

  /**
   * Preloads all required, common, and match card assets, emitting progress updates
   * on `progress$`, `isLoading$`, and `isComplete$`.
   */
  async preloadMatch(cardIds: number[]): Promise<void> {
    const token = ++this.matchLoadToken;
    const allEntries = [
      ...this.getRequiredEntries(),
      ...this.getCommonEntries(),
      ...this.getCardEntries(cardIds)
    ];
    const uniqueByKey = new Map(allEntries.map(entry => [entry.key, entry]));
    const total = uniqueByKey.size;
    let completed = 0;

    this.isCompleteSubject.next(false);
    this.isLoadingSubject.next(true);
    this.progressSubject.next(total === 0 ? 1 : 0);

    await Promise.all(
      Array.from(uniqueByKey.values()).map(async entry => {
        await this.loadEntry(entry);
        if (token !== this.matchLoadToken) return;
        completed++;
        this.progressSubject.next(completed / total);
      })
    );

    if (token !== this.matchLoadToken) return;
    this.isLoadingSubject.next(false);
    this.isCompleteSubject.next(true);
    if (environment.stage !== 'production') {
      console.info('Match assets preloaded');
    }
  }

  /**
   * Registers all preloaded `HTMLImageElement` textures into a Phaser texture manager
   * when they are not already registered.
   */
  registerPhaserTextures(textures: TextureTarget): void {
    this.loadedImages.forEach(({ image }, key) => {
      if (!textures.exists(key)) {
        textures.addImage(key, image);
      }
    });
  }

  private loadEntry(entry: AssetEntry): Promise<HTMLImageElement | undefined> {
    const url = this.getAssetUrl(entry.path);
    const cached = this.loadedImages.get(entry.key);
    if (cached && cached.url === url) {
      return Promise.resolve(cached.image);
    }

    const flightKey = `${entry.key}::${url}`;
    const existing = this.inFlight.get(flightKey);
    if (existing) return existing;

    const promise = this.loadImage(url)
      .then(image => {
        if (image) {
          this.loadedImages.set(entry.key, { url, image });
        }
        return image;
      })
      .catch(err => {
        if (environment.stage !== 'production') {
          console.warn(`Unexpected error preloading ${url}: ${err}`);
        }
        return undefined;
      })
      .finally(() => {
        this.inFlight.delete(flightKey);
      });

    this.inFlight.set(flightKey, promise);
    return promise;
  }
}
