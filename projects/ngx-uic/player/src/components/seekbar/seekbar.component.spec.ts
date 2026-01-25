import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxSeekBarComponent } from './seekbar.component';

describe('NgxSeekBarComponent', () => {
    let component: NgxSeekBarComponent;
    let fixture: ComponentFixture<NgxSeekBarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgxSeekBarComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(NgxSeekBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
