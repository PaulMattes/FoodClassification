import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TagSelectionDialogComponent } from './tag-selection-dialog.component';

describe('TagSelectionDialogComponent', () => {
  let component: TagSelectionDialogComponent;
  let fixture: ComponentFixture<TagSelectionDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TagSelectionDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TagSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
