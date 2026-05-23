import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxSeekBarDirective } from './seekbar.directive';

describe('NgxSeekBarDirective', () => {
    let component: NgxSeekBarDirective;
    let fixture: ComponentFixture<NgxSeekBarDirective>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgxSeekBarDirective]
        }).compileComponents();

        fixture = TestBed.createComponent(NgxSeekBarDirective);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
