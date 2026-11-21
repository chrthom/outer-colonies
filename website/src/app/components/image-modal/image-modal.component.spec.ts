import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ImageModalComponent, ImageModalData } from './image-modal.component';

describe('ImageModalComponent', () => {
  const createComponent = async (
    data: string | ImageModalData,
    dialogRef?: jasmine.SpyObj<MatDialogRef<ImageModalComponent>>
  ) => {
    await TestBed.configureTestingModule({
      imports: [ImageModalComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        ...(dialogRef ? [{ provide: MatDialogRef, useValue: dialogRef }] : [])
      ]
    }).compileComponents();

    const fixture: ComponentFixture<ImageModalComponent> = TestBed.createComponent(ImageModalComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('renders plain URL string data with default alt text and close button', async () => {
    const dialogRef = jasmine.createSpyObj<MatDialogRef<ImageModalComponent>>('MatDialogRef', ['close']);
    const fixture = await createComponent('https://assets.outercolonies.de/cards/101.png', dialogRef);

    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement | null;
    expect(img?.src).toBe('https://assets.outercolonies.de/cards/101.png');
    expect(img?.alt).toBe('Kartenansicht');
    expect(fixture.nativeElement.querySelector('.modal-title')).toBeNull();

    const closeBtn = fixture.nativeElement.querySelector('button.modal-close') as HTMLButtonElement | null;
    expect(closeBtn).toBeTruthy();
    closeBtn?.click();
    expect(dialogRef.close).toHaveBeenCalledTimes(1);
  });

  it('renders structured metadata with title, alt text and error fallback', async () => {
    const fixture = await createComponent({
      src: 'https://assets.outercolonies.de/cards/348.png',
      title: 'Rumpf: Kanonenboot',
      alt: 'Spielkarte Kanonenboot (Rumpf)'
    });

    expect(fixture.nativeElement.querySelector('.modal-title')?.textContent).toBe('Rumpf: Kanonenboot');
    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement | null;
    expect(img?.alt).toBe('Spielkarte Kanonenboot (Rumpf)');

    fixture.componentInstance.onImageError();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.modal-fallback')?.textContent).toContain(
      'Kartenbild konnte nicht geladen werden.'
    );
  });
});
