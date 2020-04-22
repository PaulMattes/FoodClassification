import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CsvModelComponent } from './csv-model.component';

describe('CsvModelComponent', () => {
  let component: CsvModelComponent;
  let fixture: ComponentFixture<CsvModelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CsvModelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CsvModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
