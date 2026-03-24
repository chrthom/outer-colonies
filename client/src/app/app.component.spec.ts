import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import Phaser from 'phaser';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have Phaser game config', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.config).toBeDefined();
    expect(app.config.type).toBe(Phaser.AUTO);
    expect(app.config.scene).toBeDefined();
    expect(app.config.scale).toBeDefined();
  });

  it('should initialize Phaser game', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.phaserGame).toBeDefined();
    expect(app.phaserGame instanceof Object).toBeTrue();
  });

  it('should log startup message in constructor', () => {
    // Spy on console.log
    spyOn(console, 'log');
    const fixture = TestBed.createComponent(AppComponent);
    expect(console.log).toHaveBeenCalledWith(jasmine.stringContaining('Outer Colonies client started'));
  });
});