import { TestBed } from '@angular/core/testing';
import { CardImageService } from './card-image.service';
import { MatDialog } from '@angular/material/dialog';

describe('CardImageService', () => {
  let service: CardImageService;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      providers: [{ provide: MatDialog, useValue: dialogSpy }]
    });
    service = TestBed.inject(CardImageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('cardIdToUrl produces the card image URL from cardId', () => {
    expect(service.cardIdToUrl(101)).toBe('https://assets.outercolonies.de/cards/101.png');
  });

  it('cardIdToFullUrl produces the full-resolution card image URL from cardId', () => {
    expect(service.cardIdToFullUrl(101)).toBe('https://assets.outercolonies.de/cards_full/101.png');
  });

  it('cardIdToEditionUrl produces the edition icon URL from cardId', () => {
    expect(service.cardIdToEditionUrl(101)).toBe('https://assets.outercolonies.de/icons/edition1.png');
    expect(service.cardIdToEditionUrl(450)).toBe('https://assets.outercolonies.de/icons/edition4.png');
  });

  it('rangeToUrl produces the range icon URL', () => {
    expect(service.rangeToUrl(3)).toBe('https://assets.outercolonies.de/utils/range3.png');
  });

  it('openImgInModal opens the image modal with the full-resolution card image URL', () => {
    service.openImgInModal(101);

    expect(dialogSpy.open).toHaveBeenCalledTimes(1);
    const config = dialogSpy.open.calls.mostRecent().args[1];
    expect(config?.data).toBe('https://assets.outercolonies.de/cards_full/101.png');
    expect(config?.maxHeight).toBe('95vh');
    expect(config?.restoreFocus).toBeTrue();
  });

  it('openImgInModal passes structured metadata and ariaLabel when meta is provided', () => {
    service.openImgInModal(348, {
      title: 'Rumpf: Kanonenboot',
      alt: 'Spielkarte Kanonenboot (Rumpf)'
    });

    expect(dialogSpy.open).toHaveBeenCalledTimes(1);
    const config = dialogSpy.open.calls.mostRecent().args[1];
    expect(config?.data).toEqual({
      src: 'https://assets.outercolonies.de/cards_full/348.png',
      title: 'Rumpf: Kanonenboot',
      alt: 'Spielkarte Kanonenboot (Rumpf)'
    });
    expect(config?.ariaLabel).toBe('Rumpf: Kanonenboot');
    expect(config?.restoreFocus).toBeTrue();
  });
});
