// Angular
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
// Lib
import { NgxRangeComponent } from './range.component';

describe('NgxRangeComponent', () => {
    let component: NgxRangeComponent;
    let fixture: ComponentFixture<NgxRangeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgxRangeComponent],
            providers: [provideZonelessChangeDetection()]
        }).compileComponents();

        fixture = TestBed.createComponent(NgxRangeComponent);
        component = fixture.componentInstance;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize default values for inputs and models', () => {
        fixture.componentRef.setInput('type', 'double');
        fixture.componentRef.setInput('step', 2);
        expect(component.type()).toBe('double');
        expect(component.min()).toBe(0);
        expect(component.step()).toBe(2);
        expect(component.max()).toBe(100);
    });

    it('should display the correct number of thumbs', () => {
        const thumbs = fixture.nativeElement.getElementsByClassName('thumb') as HTMLCollectionOf<HTMLElement>;
        const tumb1Style = getComputedStyle(thumbs[0]);
        const tumb2Style = getComputedStyle(thumbs[1]);
        fixture.componentRef.setInput('type', 'simple');
        fixture.detectChanges();
        expect(tumb1Style.getPropertyValue('display')).not.toBe('none');
        expect(tumb2Style.getPropertyValue('display')).toBe('none');
        fixture.componentRef.setInput('type', 'double');
        fixture.detectChanges();
        expect(tumb1Style.getPropertyValue('display')).not.toBe('none');
        expect(tumb2Style.getPropertyValue('display')).not.toBe('none');
    });

    it('should compute the correct percentage values', () => {
        fixture.componentRef.setInput('type', 'simple');
        fixture.componentRef.setInput('min', 20);
        fixture.componentRef.setInput('value', 30);
        fixture.componentRef.setInput('max', 40);
        // @ts-ignore
        expect(component.high()).toBe(50);
        fixture.componentRef.setInput('type', 'double');
        fixture.componentRef.setInput('lower', 25);
        fixture.componentRef.setInput('upper', 35);
        fixture.detectChanges();
        // @ts-ignore
        expect(component.low()).toBe(25);
        // @ts-ignore
        expect(component.high()).toBe(75);
    });

    it('should update styles when the value changes', () => {
        const slider = fixture.nativeElement.getElementsByClassName('slider')[0] as HTMLElement;
        const sliderStyle = getComputedStyle(slider);
        const thumbs = slider.getElementsByClassName('thumb') as HTMLCollectionOf<HTMLElement>;
        const tumb1Style = getComputedStyle(thumbs[0]);
        const tumb2Style = getComputedStyle(thumbs[1]);
        fixture.detectChanges();
        expect(fixture.nativeElement.style.getPropertyValue('--high')).toBe('0');
        expect(parseFloat(tumb1Style.left)).toBe(0);
        expect(parseFloat(tumb2Style.left)).toBe(0);
        fixture.componentRef.setInput('value', 25);
        fixture.detectChanges();
        expect(fixture.nativeElement.style.getPropertyValue('--high')).toBe('25');
        expect(parseFloat(tumb1Style.left)).toBe(0);
        expect(parseFloat(tumb2Style.left)).toBe(parseFloat(sliderStyle.width) / 4);
    });

    it('should set the value within bounds', () => {
        // @ts-ignore
        component.setValue(120);
        expect(component.value()).toBe(100);
        // @ts-ignore
        component.setValue(-10);
        expect(component.value()).toBe(0);
        // @ts-ignore
        component.setValue(50);
        expect(component.value()).toBe(50);
    });

    it('should allow any value when setting "step" to 0', () => {
        fixture.componentRef.setInput('step', 0); // Allows any value
        // @ts-ignore
        component.setValue(42);
        expect(component.value()).toBe(42);
        // @ts-ignore
        component.setValue(43.5);
        expect(component.value()).toBe(43.5);
    });

    it('should constraint values to be mutliple of "step"', () => {
        fixture.componentRef.setInput('step', 5);
        // @ts-ignore
        component.setValue(42);
        expect(component.value()).toBe(40);
        // @ts-ignore
        component.setValue(43.5);
        expect(component.value()).toBe(45);
    });

    it('should emit correct change event', () => {
        spyOn(component.change, 'emit');
        fixture.componentRef.setInput('type', 'simple');
        // @ts-ignore
        component.setValue(50);
        expect(component.change.emit).toHaveBeenCalledWith({ value: 50 });
        fixture.componentRef.setInput('type', 'double');
        // @ts-ignore
        component.setValue(25, 'first');
        expect(component.change.emit).toHaveBeenCalledWith({ lower: 25, upper: component.max() });
        // @ts-ignore
        component.setValue(75, 'last');
        expect(component.change.emit).toHaveBeenCalledWith({ lower: 25, upper: 75 });
    });

    it('should emit correct input event', () => {
        spyOn(component.input, 'emit');
        fixture.componentRef.setInput('type', 'simple');
        // @ts-ignore
        component.setValue(50);
        expect(component.input.emit).toHaveBeenCalledWith(50);
        fixture.componentRef.setInput('type', 'double');
        // @ts-ignore
        component.setValue(25, 'first');
        expect(component.input.emit).toHaveBeenCalledWith(25);
        // @ts-ignore
        component.setValue(75, 'last');
        expect(component.input.emit).toHaveBeenCalledWith(75);
    });

    it('should display marks', () => {
        fixture.componentRef.setInput('marks', true);
        const marks = fixture.nativeElement.getElementsByClassName('mark') as HTMLCollectionOf<HTMLElement>;
        expect(marks.length).toBe(101);
    });
});
