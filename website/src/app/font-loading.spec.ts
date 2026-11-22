import { fakeAsync, tick } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { FontFaceLike, FontLoadingDocument, initFontLoading } from './font-loading';

describe('initFontLoading', () => {
  const originalStage = environment.stage;

  afterEach(() => {
    environment.stage = originalStage;
  });

  function createFonts(
    faces: FontFaceLike[],
    load: (spec: string) => Promise<FontFace[]> = () => Promise.resolve([])
  ): NonNullable<FontLoadingDocument['fonts']> {
    return {
      load,
      forEach: callbackfn => {
        for (const face of faces) {
          callbackfn(face as FontFace, face as FontFace, undefined as unknown as FontFaceSet);
        }
      }
    };
  }

  function createDoc(fonts?: FontLoadingDocument['fonts']): {
    doc: FontLoadingDocument;
    root: HTMLElement;
  } {
    const root = document.createElement('html');
    return {
      root,
      doc: {
        documentElement: root,
        fonts
      }
    };
  }

  it('reveals immediately when the Font Loading API is unavailable', async () => {
    const { doc, root } = createDoc(undefined);
    await initFontLoading(doc);
    expect(root.classList.contains('oc-fonts-loading')).toBeFalse();
  });

  it('skips hiding content when both critical fonts are already loaded', async () => {
    const loadSpy = jasmine.createSpy('load');
    const { doc, root } = createDoc(
      createFonts(
        [
          { family: '"Latin Modern Sans"', weight: '400', style: 'normal', status: 'loaded' },
          { family: 'Latin Modern Mono Caps', weight: 'normal', style: 'normal', status: 'loaded' }
        ],
        loadSpy
      )
    );

    await initFontLoading(doc);

    expect(loadSpy).not.toHaveBeenCalled();
    expect(root.classList.contains('oc-fonts-loading')).toBeFalse();
  });

  it('hides content while critical fonts load and reveals once both settle', fakeAsync(() => {
    let resolveSans!: () => void;
    let resolveMono!: () => void;
    const { doc, root } = createDoc(
      createFonts(
        [
          { family: 'Latin Modern Sans', weight: 'normal', style: 'normal', status: 'loading' },
          { family: 'Latin Modern Mono Caps', weight: 'normal', style: 'normal', status: 'unloaded' }
        ],
        (spec: string) =>
          new Promise<FontFace[]>(resolve => {
            if (spec.includes('Sans')) {
              resolveSans = () => resolve([]);
            } else {
              resolveMono = () => resolve([]);
            }
          })
      )
    );

    let done = false;
    void initFontLoading(doc, 1200).then(() => {
      done = true;
    });

    expect(root.classList.contains('oc-fonts-loading')).toBeTrue();
    tick();

    resolveSans();
    tick();
    expect(root.classList.contains('oc-fonts-loading')).toBeTrue();
    expect(done).toBeFalse();

    resolveMono();
    tick();
    expect(root.classList.contains('oc-fonts-loading')).toBeFalse();
    expect(done).toBeTrue();
  }));

  it('degrades gracefully when a critical font fails to load', fakeAsync(() => {
    environment.stage = 'development';
    const warnSpy = spyOn(console, 'warn');
    const { doc, root } = createDoc(
      createFonts(
        [
          { family: 'Latin Modern Sans', weight: 'normal', style: 'normal', status: 'loading' },
          { family: 'Latin Modern Mono Caps', weight: 'normal', style: 'normal', status: 'loading' }
        ],
        (spec: string) => (spec.includes('Sans') ? Promise.resolve([]) : Promise.reject(new Error('404')))
      )
    );

    void initFontLoading(doc, 1200);
    expect(root.classList.contains('oc-fonts-loading')).toBeTrue();

    tick();
    expect(root.classList.contains('oc-fonts-loading')).toBeFalse();
    expect(warnSpy).toHaveBeenCalledOnceWith('Critical webfont failed to load, degrading to fallback font');
  }));

  it('reveals content when font loading exceeds the safety timeout', fakeAsync(() => {
    environment.stage = 'production';
    const warnSpy = spyOn(console, 'warn');
    const { doc, root } = createDoc(
      createFonts(
        [
          { family: 'Latin Modern Sans', weight: 'normal', style: 'normal', status: 'loading' },
          { family: 'Latin Modern Mono Caps', weight: 'normal', style: 'normal', status: 'loading' }
        ],
        () => new Promise<FontFace[]>(() => {})
      )
    );

    let done = false;
    void initFontLoading(doc, 1200).then(() => {
      done = true;
    });

    expect(root.classList.contains('oc-fonts-loading')).toBeTrue();
    tick(1199);
    expect(root.classList.contains('oc-fonts-loading')).toBeTrue();

    tick(1);
    expect(root.classList.contains('oc-fonts-loading')).toBeFalse();
    expect(done).toBeTrue();
    expect(warnSpy).not.toHaveBeenCalled();
  }));

  it('degrades to immediate visibility when inspecting fonts throws', async () => {
    environment.stage = 'development';
    const warnSpy = spyOn(console, 'warn');
    const { doc, root } = createDoc({
      load: jasmine.createSpy('load'),
      forEach: () => {
        throw new Error('broken font set');
      }
    });

    await initFontLoading(doc);
    expect(root.classList.contains('oc-fonts-loading')).toBeFalse();
    expect(warnSpy).toHaveBeenCalledOnceWith('Font status check failed, revealing page with fallback fonts');
  });
});
