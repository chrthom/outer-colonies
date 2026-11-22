import { environment } from 'src/environments/environment';

const CRITICAL_FONTS = [
  { family: 'Latin Modern Sans', spec: '1em "Latin Modern Sans"' },
  { family: 'Latin Modern Mono Caps', spec: '1em "Latin Modern Mono Caps"' }
] as const;
const FONT_LOADING_CLASS = 'oc-fonts-loading';
const DEFAULT_FONT_TIMEOUT_MS = 1200;

export interface FontFaceLike {
  family: string;
  weight: string;
  style: string;
  status: FontFaceLoadStatus;
}

export interface FontLoadingDocument {
  documentElement: Pick<HTMLElement, 'classList'> | null;
  fonts?: Pick<FontFaceSet, 'load' | 'forEach'>;
}

function normalizeFamily(family: string): string {
  return family.trim().replace(/^["']|["']$/g, '');
}

function areCriticalFontsLoaded(fonts: Pick<FontFaceSet, 'forEach'>): boolean {
  const faces: FontFaceLike[] = [];
  fonts.forEach(face => faces.push(face));
  if (faces.length === 0) {
    // No @font-face declarations present (e.g. test harness without global styles); never hide content.
    return true;
  }

  return CRITICAL_FONTS.every(({ family }) => {
    const matching = faces.filter(
      face =>
        normalizeFamily(face.family) === family &&
        (face.weight === 'normal' || face.weight === '400') &&
        face.style === 'normal'
    );
    return matching.length === 0 || matching.every(face => face.status === 'loaded');
  });
}

/**
 * Prevents a flash of fallback fonts on initial load by hiding foreground content until the
 * critical webfonts have settled or a short timeout expires.
 * @param doc Document whose font set and root element are coordinated
 * @param timeoutMs Maximum wait time in milliseconds before revealing with fallback fonts
 * @returns Promise that resolves once the loading class has been cleared
 */
export function initFontLoading(
  doc: FontLoadingDocument = document,
  timeoutMs: number = DEFAULT_FONT_TIMEOUT_MS
): Promise<void> {
  const fonts = doc.fonts;
  const root = doc.documentElement;
  if (!fonts?.load || typeof fonts.forEach !== 'function' || !root) {
    return Promise.resolve();
  }

  try {
    if (areCriticalFontsLoaded(fonts)) {
      root.classList.remove(FONT_LOADING_CLASS);
      return Promise.resolve();
    }
  } catch {
    if (environment.stage !== 'production') {
      console.warn('Font status check failed, revealing page with fallback fonts');
    }
    root.classList.remove(FONT_LOADING_CLASS);
    return Promise.resolve();
  }

  root.classList.add(FONT_LOADING_CLASS);

  let timerId: ReturnType<typeof setTimeout> | undefined;
  let settledByFonts = false;

  const loadPromise = Promise.allSettled(
    CRITICAL_FONTS.map(({ spec }) => Promise.resolve().then(() => fonts.load(spec)))
  ).then(results => {
    settledByFonts = true;
    if (results.some(result => result.status === 'rejected') && environment.stage !== 'production') {
      console.warn('Critical webfont failed to load, degrading to fallback font');
    }
  });

  const timeoutPromise = new Promise<void>(resolve => {
    timerId = setTimeout(() => {
      if (!settledByFonts && environment.stage !== 'production') {
        console.warn('Critical webfont loading timed out, revealing page with fallback fonts');
      }
      resolve();
    }, timeoutMs);
  });

  return Promise.race([loadPromise, timeoutPromise]).finally(() => {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    root.classList.remove(FONT_LOADING_CLASS);
  });
}
