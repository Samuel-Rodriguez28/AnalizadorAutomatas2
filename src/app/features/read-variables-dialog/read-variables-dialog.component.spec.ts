import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReadVariablesDialogComponent } from './read-variables-dialog.component';

describe('ReadVariablesDialogComponent', () => {
  let component: ReadVariablesDialogComponent;
  let fixture: ComponentFixture<ReadVariablesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReadVariablesDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReadVariablesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
