import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the page heading', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Reservatórios de Água');
  });

  it('should have three reservoirs with growing capacities', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const capacities = app.reservoirs.map(r => r.capacity);
    expect(capacities).toEqual([200, 500, 1000]);
    expect(capacities[0]).toBeLessThan(capacities[1]);
    expect(capacities[1]).toBeLessThan(capacities[2]);
  });

  it('should start with all reservoirs empty', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.reservoirs.forEach(r => expect(r.level).toBe(0));
  });

  it('addWater() should queue pending water', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.waterInputAmount = 150;
    app.addWater();
    expect(app.pendingWater).toBe(150);
  });

  it('addWater() should accumulate multiple additions', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.waterInputAmount = 100;
    app.addWater();
    app.waterInputAmount = 50;
    app.addWater();
    expect(app.pendingWater).toBe(150);
  });

  it('getFillPercent() should return 0 for empty reservoir', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app.getFillPercent(0)).toBe(0);
  });

  it('getFillPercent() should return 50 when half full', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.reservoirs[0].level = 100; // half of 200
    expect(app.getFillPercent(0)).toBe(50);
  });

  it('getFillPercent() should not exceed 100', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.reservoirs[0].level = 999;
    expect(app.getFillPercent(0)).toBeLessThanOrEqual(100);
  });

  it('toggleTap() should open a closed tap', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app.reservoirs[0].tapOpen).toBe(false);
    app.toggleTap(0);
    expect(app.reservoirs[0].tapOpen).toBe(true);
  });

  it('toggleTap() should close an open tap', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.toggleTap(0);
    app.toggleTap(0);
    expect(app.reservoirs[0].tapOpen).toBe(false);
  });

  it('getWaterHeight() should be proportional to level', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.reservoirs[0].level = 200; // full
    const fullHeight = app.getWaterHeight(0);
    app.reservoirs[0].level = 100; // half
    const halfHeight = app.getWaterHeight(0);
    expect(fullHeight).toBeCloseTo(halfHeight * 2, 1);
  });

  it('isOverflowing() should be false when not at capacity', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.reservoirs[0].level = 100;
    expect(app.isOverflowing(0)).toBe(false);
  });

  it('isOverflowing() should be true when at full capacity', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.reservoirs[0].level = 200;
    expect(app.isOverflowing(0)).toBe(true);
  });

  it('should cleanup interval on destroy', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.waterInputAmount = 100;
    app.addWater(); // starts the interval
    expect(() => app.ngOnDestroy()).not.toThrow();
  });
});
