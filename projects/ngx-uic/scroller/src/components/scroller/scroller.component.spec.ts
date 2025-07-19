import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
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
