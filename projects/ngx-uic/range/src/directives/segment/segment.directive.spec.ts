import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxSegmentDirective } from './segment.directive';

describe('Segment', () => {
    let component: NgxSegmentDirective;
    let fixture: ComponentFixture<NgxSegmentDirective>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgxSegmentDirective]
        })
            .compileComponents();

        fixture = TestBed.createComponent(NgxSegmentDirective);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
