import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { NgxScrollerComponent } from './scroller.component';

describe('NgxScrollerComponent', () => {
    let component: NgxScrollerComponent;
    let fixture: ComponentFixture<NgxScrollerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgxScrollerComponent],
            providers: [provideZonelessChangeDetection()]
        }).compileComponents();

        fixture = TestBed.createComponent(NgxScrollerComponent);
        fixture.componentRef.setInput('loader', () => of([1, 2, 3, 4, 5, 6, 7, 8, 9]));
        component = fixture.componentInstance;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with empty items', () => {
        // @ts-ignore
        expect(component.items()).toEqual([]);
    });

    it('should load items on initialization', () => {
        // @ts-ignore
        spyOn(component, 'loadItems');
        // @ts-ignore
        component.ngOnInit();
        // @ts-ignore
        expect(component.loadItems).toHaveBeenCalled();
    });

    it('should not load items on initialization when passing retry observable', () => {
        const retry$ = new Subject<void>();
        fixture.componentRef.setInput('retry', retry$);
        // @ts-ignore
        spyOn(component, 'loadItems');
        // @ts-ignore
        component.ngOnInit();
        // @ts-ignore
        expect(component.loadItems).not.toHaveBeenCalled();
    });

    it('should append items from buffer', () => {
        // @ts-ignore
        component.buffer = [1, 2, 3];
        // @ts-ignore
        component.appendItems();
        // @ts-ignore
        expect(component.buffer).toEqual([]);
        // @ts-ignore
        expect(component.items()).toEqual([1, 2, 3]);
    });

    it('should process batch appending correctly', () => {
        fixture.componentRef.setInput('batch', 2);
        // @ts-ignore
        component.buffer = [1, 2, 3];
        // @ts-ignore
        component.appendItems();
        // @ts-ignore
        expect(component.items()).toEqual([1, 2]);
        // @ts-ignore
        component.appendItems();
        // @ts-ignore
        expect(component.items()).toEqual([1, 2, 3]);
    });

    it('should update buffer after calling loader function', (done) => {
        // @ts-ignore
        expect(component.buffer).toEqual([]);
        // @ts-ignore
        component.loadItems();
        setTimeout(() => {
            // @ts-ignore
            expect(component.buffer).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            done();
        }, 100);
    });

    it('should handle remove input', () => {
        const remove$ = new Subject<number[]>();
        fixture.componentRef.setInput('remove', remove$);
        // @ts-ignore
        component.items().set([1, 2, 3, 4]);
        remove$.next([1, 3]);
        // @ts-ignore
        expect(component.items()).toEqual([2, 4]);
    });

    it('should handle reset input', () => {
        const reset$ = new Subject<void>();
        fixture.componentRef.setInput('reset', reset$);
        // @ts-ignore
        component.items().set([1, 2, 3]);
        reset$.next();
        // @ts-ignore
        expect(component.items()).toEqual([]);
    });

    it('should handle retry input', () => {
        const retry$ = new Subject<void>();
        fixture.componentRef.setInput('retry', retry$);
        // @ts-ignore
        spyOn(component, 'loadItems');
        retry$.next();
        // @ts-ignore
        expect(component.loadItems).toHaveBeenCalled();
    });

    it('should emit loading state', (done) => {
        spyOn(component.loading, 'emit');
        // @ts-ignore
        component.loadItems();
        expect(component.loading.emit).toHaveBeenCalledWith(true);
        setTimeout(() => {
            expect(component.loading.emit).toHaveBeenCalledWith(false);
            done();
        });
    });
});
