import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TradePage } from './trade.page';
import { RouterTestingModule } from '@angular/router/testing';
import { ItemApiService } from 'src/app/api/item-api.service';
import { ProfileApiService } from 'src/app/api/profile-api.service';
import { of } from 'rxjs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('TradePage', () => {
  let component: TradePage;
  let fixture: ComponentFixture<TradePage>;
  let itemApiSpy: jasmine.SpyObj<ItemApiService>;
  let profileApiSpy: jasmine.SpyObj<ProfileApiService>;

  beforeEach(async () => {
    itemApiSpy = jasmine.createSpyObj('ItemApiService', ['items', 'buyBooster', 'open']);
    profileApiSpy = jasmine.createSpyObj('ProfileApiService', ['profile']);

    spyOnProperty(itemApiSpy, 'items', 'get').and.returnValue(
      of({
        boosters: [
          { itemId: 1, no: 1, amount: 5 },
          { itemId: 2, no: 2, amount: 3 }
        ],
        boxes: [
          { itemId: 1, sol: [100], cards: [101, 102], boosters: [], type: 'box', amount: 2 },
          { itemId: 2, sol: [200], cards: [103], boosters: [], type: 'box', amount: 1 }
        ]
      })
    );

    spyOnProperty(profileApiSpy, 'profile', 'get').and.returnValue(
      of({
        username: 'testuser',
        sol: 1000,
        newsletter: false
      })
    );

    itemApiSpy.buyBooster.and.returnValue(of(undefined));
    itemApiSpy.open.and.returnValue(
      of({
        itemId: 1,
        sol: [100, 200],
        boosters: [1],
        cards: [101]
      })
    );

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        MatSnackBarModule,
        MatCardModule,
        MatButtonModule,
        BrowserAnimationsModule
      ],
      declarations: [],
      providers: [
        { provide: ItemApiService, useValue: itemApiSpy },
        { provide: ProfileApiService, useValue: profileApiSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TradePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load items and profile on init', () => {
    expect(component.sol).toBe(1000);
    expect(component.boosters.length).toBe(2);
    expect(component.boxes.length).toBe(2);
  });

  it('should have correct available boosters', () => {
    expect(component.availableBoosters.length).toBe(4);
    expect(component.availableBoosters[0].no).toBe(1);
    expect(component.availableBoosters[0].title).toBe('Outer Colonies');
  });

  it('should buy booster when called', () => {
    component.buyBooster(1);
    expect(itemApiSpy.buyBooster).toHaveBeenCalledWith(1);
  });

  it('should not buy booster when insufficient sol', () => {
    component.sol = 0; // Set sol to 0
    component.buyBooster(1);
    expect(itemApiSpy.buyBooster).not.toHaveBeenCalled();
  });

  it('should open item when called', () => {
    component.open(1);
    expect(itemApiSpy.open).toHaveBeenCalledWith(1);
    expect(component.openedBoxContent).toBeDefined();
  });

  it('should close opened box', () => {
    component.openedBoxContent = {
      itemId: 1,
      sol: [100],
      boosters: [],
      cards: []
    };
    component.boxClosed();
    expect(component.openedBoxContent).toBeUndefined();
  });

  it('should reload data when called', () => {
    component.reload();
    expect(component.sol).toBe(1000);
    expect(component.boosters.length).toBe(2);
    expect(component.boxes.length).toBe(2);
  });
});
