import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import Phaser from 'phaser';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  it('should create the app', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    expect(app).toBeTruthy();
  });

  it('creates the Phaser game with the view and destroys it with the component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.phaserGame).withContext('not before the view exists').toBeUndefined();

    fixture.detectChanges(); // triggers ngAfterViewInit
    expect(app.phaserGame).toBeInstanceOf(Phaser.Game);

    const destroySpy = spyOn(app.phaserGame!, 'destroy');
    fixture.destroy(); // triggers ngOnDestroy
    expect(destroySpy).toHaveBeenCalledWith(true);
    expect(app.phaserGame).toBeUndefined();
  });
});
