import { CommonModule } from '@angular/common';
import { Component, ElementRef, input, provideZonelessChangeDetection, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject, of } from 'rxjs';
import { NgxScrollerComponent } from './scroller.component';
import { ScrollerLoader } from '../../models/scroller-loader.model';
import { ScrollerType } from '../../models/scroller-type.model';

@Component({
    imports: [CommonModule, NgxScrollerComponent],
    template: `
        <ngx-scroller
            [batch]="batch()"
            [loader]="loader()"
            [offset]="offset()"
            [remove]="remove()"
            [reset]="reset()"
            [retry]="retry()"
            [threshold]="threshold()"
            #componentRef>
            <ng-template let-item>
                <p>{{ item }}</p>
            </ng-template>
        </ngx-scroller>
    `
})
class WrapperComponent {
    readonly batch = input(1, { transform: (value: number | string) => Number(value) > 0 ? Number(value) : 1 });
    readonly loader = input.required<ScrollerLoader<any[]>>();
    readonly offset = input<number | string>(0);
    readonly remove = input<Observable<any | any[]>>();
    readonly reset = input<Observable<void>>();
    readonly retry = input<Observable<void>>();
    readonly threshold = input<number | number[]>(0);
    readonly type = input<ScrollerType>('unidirectional');

    component = viewChild.required(NgxScrollerComponent);
    elementRef = viewChild.required<ElementRef<HTMLElement>>('componentRef');
}

describe('NgxScrollerComponent', () => {
    let component: NgxScrollerComponent;
    let fixture: ComponentFixture<WrapperComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgxScrollerComponent, WrapperComponent],
            providers: [provideZonelessChangeDetection()]
        }).compileComponents();

        fixture = TestBed.createComponent(WrapperComponent);
        fixture.componentRef.setInput('loader', () => of([1, 2, 3, 4, 5]));
        component = fixture.componentInstance.component();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should load items on initialization', () => {
        // @ts-ignore
        spyOn(component, 'loadItems');
        fixture.detectChanges();
        // @ts-ignore
        expect(component.loadItems).toHaveBeenCalled();
    });

    it('should not load items on initialization when passing retry observable', () => {
        const retry$ = new Subject<void>();
        fixture.componentRef.setInput('retry', retry$);
        // @ts-ignore
        spyOn(component, 'loadItems');
        fixture.detectChanges();
        // @ts-ignore
        expect(component.loadItems).not.toHaveBeenCalled();
    });

    it('should batch append content', () => {
        fixture.componentRef.setInput('batch', 3);
        fixture.detectChanges();
        // @ts-ignore
        expect(component.content()).toEqual([1, 2, 3]);
        // @ts-ignore
        component.addContent(component.batch());
        // @ts-ignore
        expect(component.content()).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle removing items', () => {
        const remove$ = new Subject<number[]>();
        fixture.componentRef.setInput('remove', remove$);
        fixture.detectChanges();
        // @ts-ignore
        expect(component.items()).toEqual([1, 2, 3, 4, 5]);
        remove$.next([1, 3]);
        // @ts-ignore
        expect(component.items()).toEqual([2, 4, 5]);
    });

    it('should handle resettng items', () => {
        const reset$ = new Subject<void>();
        fixture.componentRef.setInput('reset', reset$);
        fixture.detectChanges();
        // @ts-ignore
        expect(component.items()).toEqual([1, 2, 3, 4, 5]);
        reset$.next();
        // @ts-ignore
        expect(component.items()).toEqual([]);
    });

    it('should handle retry loading items', (done) => {
        const retry$ = new Subject<void>();
        fixture.componentRef.setInput('retry', retry$);
        fixture.detectChanges();
        // @ts-ignore
        expect(component.items()).toEqual([]);
        retry$.next();
        retry$.next();
        setTimeout(() => {
            // @ts-ignore
            expect(component.items()).toEqual([1, 2, 3, 4, 5, 1, 2, 3, 4, 5]);
            done();
        });
    });

    it('should emit loading state', (done) => {
        spyOn(component.loading, 'emit');
        fixture.detectChanges();
        expect(component.loading.emit).toHaveBeenCalledWith(true);
        setTimeout(() => {
            // @ts-ignore
            expect(component.loading.emit).toHaveBeenCalledWith(false);
            done();
        });
    });
});
