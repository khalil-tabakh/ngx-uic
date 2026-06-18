import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxSelectComponent } from './select.component';

describe('NgxSelectComponent', () => {
    let component: NgxSelectComponent;
    let element: HTMLElement;
    let fixture: ComponentFixture<NgxSelectComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgxSelectComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(NgxSelectComponent);
        component = fixture.componentInstance;
        element = fixture.nativeElement;
    });
});
