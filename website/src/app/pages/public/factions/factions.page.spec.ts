import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FactionsPage } from './factions.page';

describe('FactionsPage', () => {
  let component: FactionsPage;
  let fixture: ComponentFixture<FactionsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FactionsPage]
    }).compileComponents();

    fixture = TestBed.createComponent(FactionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the role assignment intro line', () => {
    expect(fixture.nativeElement.textContent).toContain(
      'Terra ernährt das System, Mars bewaffnet es, Venus besitzt es – und die Outer Colonies behaupten sich.'
    );
  });

  it('should render one content box per faction', () => {
    const boxes = fixture.nativeElement.querySelectorAll('oc-content-box');
    expect(boxes.length).toBe(4);
    const titles = Array.from<Element>(boxes).map(b => b.getAttribute('title'));
    expect(titles).toEqual([
      'Terra – die Erde',
      'Mars – die Häuser',
      'Venus – die Habitats',
      'Outer Colonies – wir'
    ]);
  });

  it('should list the five marsian houses as compact table', () => {
    const table = fixture.nativeElement.querySelector('table.house-table');
    expect(table).toBeTruthy();
    const houses = Array.from<Element>(table.querySelectorAll('th')).map(th => th.textContent);
    expect(houses).toEqual(['Tharsis', 'Elysium', 'Hellas', 'Arcadia', 'Isidis']);
  });

  it('should reuse the four canon quotes with Layla Chen on Venus', () => {
    const quotes = fixture.nativeElement.querySelectorAll('oc-quote');
    expect(quotes.length).toBe(4);
    const attributions = Array.from<Element>(quotes).map(
      q => q.querySelector('figcaption')?.textContent ?? ''
    );
    expect(attributions[0]).toContain('Aygül Demir');
    expect(attributions[1]).toContain('Alexios Drakon Hellas');
    expect(attributions[2]).toContain('Layla Chen');
    expect(attributions[3]).toContain('Zubaida Kaur');
  });
});
