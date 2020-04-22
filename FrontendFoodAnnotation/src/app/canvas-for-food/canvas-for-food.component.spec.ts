import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CanvasForFoodComponent } from './canvas-for-food.component';

describe('CanvasForFoodComponent', () => {
  let component: CanvasForFoodComponent;
  let fixture: ComponentFixture<CanvasForFoodComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CanvasForFoodComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CanvasForFoodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
