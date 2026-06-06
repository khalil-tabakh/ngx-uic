import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxRangeComponent } from './range.component';

describe('NgxRangeComponent', () => {
    let component: NgxRangeComponent;
    let element: HTMLElement;
    let fixture: ComponentFixture<NgxRangeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgxRangeComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(NgxRangeComponent);
        component = fixture.componentInstance;
        element = fixture.nativeElement;
    });

    it('should initialize single mode models', () => {
        fixture.componentRef.setInput('type', 'single');
        fixture.detectChanges();
        expect(component.lower()).toBe(NaN);
        expect(component.value()).toBe(50);
        expect(component.upper()).toBe(NaN);
    });

    it('should initialize double mode models', () => {
        fixture.componentRef.setInput('type', 'double');
        fixture.detectChanges();
        expect(component.lower()).toBe(25);
        expect(component.value()).toBe(NaN);
        expect(component.upper()).toBe(75);
    });

    it('should map the step input', () => {
        fixture.componentRef.setInput('min', 30);
        fixture.componentRef.setInput('max', 70);
        fixture.componentRef.setInput('step', 0);
        fixture.detectChanges();
        expect(component.steps()).toEqual([]);
        fixture.componentRef.setInput('step', '0');
        fixture.detectChanges();
        expect(component.steps()).toEqual([]);
        fixture.componentRef.setInput('step', []);
        fixture.detectChanges();
        expect(component.steps()).toEqual([]);
        fixture.componentRef.setInput('step', NaN);
        fixture.detectChanges();
        expect(component.steps()).toEqual([]);
        fixture.componentRef.setInput('step', '20');
        fixture.detectChanges();
        expect(component.steps()).toEqual([30, 50, 70]);
        fixture.componentRef.setInput('step', 30);
        fixture.detectChanges();
        expect(component.steps()).toEqual([30, 60]);
        fixture.componentRef.setInput('step', [10, 50, 90]);
        fixture.detectChanges();
        expect(component.steps()).toEqual([50]);
    });

    it('should map the relative input', () => {
        fixture.componentRef.setInput('min', 30);
        fixture.componentRef.setInput('max', 70);
        fixture.componentRef.setInput('relative', undefined);
        fixture.detectChanges();
        expect(component.origin()).toEqual(30);
        fixture.componentRef.setInput('relative', NaN);
        fixture.detectChanges();
        expect(component.origin()).toEqual(30);
        fixture.componentRef.setInput('relative', 10);
        fixture.detectChanges();
        expect(component.origin()).toEqual(30);
        fixture.componentRef.setInput('relative', '50');
        fixture.detectChanges();
        expect(component.origin()).toEqual(50);
    });

    it('should display the correct number of marks', () => {
        fixture.componentRef.setInput('min', 30);
        fixture.componentRef.setInput('max', 70);
        fixture.componentRef.setInput('mark', 0);
        fixture.detectChanges();
        expect(component.marks()).toEqual([]);
        expect(element.getElementsByClassName('mark').length).toBe(0);
        fixture.componentRef.setInput('mark', '0');
        fixture.detectChanges();
        expect(component.marks()).toEqual([]);
        expect(element.getElementsByClassName('mark').length).toBe(0);
        fixture.componentRef.setInput('mark', []);
        fixture.detectChanges();
        expect(component.marks()).toEqual([]);
        expect(element.getElementsByClassName('mark').length).toBe(0);
        fixture.componentRef.setInput('mark', NaN);
        fixture.detectChanges();
        expect(component.marks()).toEqual([]);
        expect(element.getElementsByClassName('mark').length).toBe(0);
        fixture.componentRef.setInput('mark', '20');
        fixture.detectChanges();
        expect(component.marks()).toEqual([30, 50, 70]);
        expect(element.getElementsByClassName('mark').length).toBe(3);
        fixture.componentRef.setInput('mark', 30);
        fixture.detectChanges();
        expect(component.marks()).toEqual([30, 60]);
        expect(element.getElementsByClassName('mark').length).toBe(2);
        fixture.componentRef.setInput('mark', [10, 50, 90]);
        fixture.detectChanges();
        expect(component.marks()).toEqual([50]);
        expect(element.getElementsByClassName('mark').length).toBe(1);
    });

    it('should display the correct number of segments', () => {
        fixture.componentRef.setInput('min', 30);
        fixture.componentRef.setInput('max', 70);
        fixture.componentRef.setInput('split', 0);
        fixture.detectChanges();
        expect(component.splits()).toEqual([]);
        expect(component.segmentRefs().length).toEqual(1);
        expect(element.getElementsByClassName('segment').length).toBe(1);
        fixture.componentRef.setInput('split', '0');
        fixture.detectChanges();
        expect(component.splits()).toEqual([]);
        expect(component.segmentRefs().length).toEqual(1);
        expect(element.getElementsByClassName('segment').length).toBe(1);
        fixture.componentRef.setInput('split', []);
        fixture.detectChanges();
        expect(component.splits()).toEqual([]);
        expect(component.segmentRefs().length).toEqual(1);
        expect(element.getElementsByClassName('segment').length).toBe(1);
        fixture.componentRef.setInput('split', NaN);
        fixture.detectChanges();
        expect(component.splits()).toEqual([]);
        expect(component.segmentRefs().length).toEqual(1);
        expect(element.getElementsByClassName('segment').length).toBe(1);
        fixture.componentRef.setInput('split', '20');
        fixture.detectChanges();
        expect(component.splits()).toEqual([30, 50, 70]);
        expect(component.segmentRefs().length).toEqual(4);
        expect(element.getElementsByClassName('segment').length).toBe(4);
        fixture.componentRef.setInput('split', 30);
        fixture.detectChanges();
        expect(component.splits()).toEqual([30, 60]);
        expect(component.segmentRefs().length).toEqual(3);
        expect(element.getElementsByClassName('segment').length).toBe(3);
        fixture.componentRef.setInput('split', [10, 50, 90]);
        fixture.detectChanges();
        expect(component.splits()).toEqual([50]);
        expect(component.segmentRefs().length).toEqual(2);
        expect(element.getElementsByClassName('segment').length).toBe(2);
    });

    it('should display the correct number of thumbs', () => {
        fixture.componentRef.setInput('type', 'single');
        fixture.detectChanges();
        expect(component.thumbRefs().length).toBe(1);
        fixture.componentRef.setInput('type', 'double');
        fixture.detectChanges();
        expect(component.thumbRefs().length).toBe(2);
    });
});
