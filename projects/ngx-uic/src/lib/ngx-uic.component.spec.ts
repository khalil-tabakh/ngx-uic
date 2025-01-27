import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxUicComponent } from './ngx-uic.component';

describe('NgxUicComponent', () => {
  let component: NgxUicComponent;
  let fixture: ComponentFixture<NgxUicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxUicComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxUicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
