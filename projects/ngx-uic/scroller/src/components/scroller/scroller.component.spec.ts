
import { Component, ElementRef, booleanAttribute, inject, input, provideZonelessChangeDetection, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxScrollerComponent } from './scroller.component';

@Component({
    imports: [NgxScrollerComponent],
    template: `
        <ngx-scroller
            class="column"
            [batch]="batch()"
            [items]="items()"
            [offset]="offset()"
            [overflow]="overflow()"
            [root]="root()"
            [rootMargin]="rootMargin()"
            [threshold]="threshold()"
            [virtualize]="virtualize()"
            (first)="onFirst()"
            (last)="onLast()"
            #scroller
        >
            @for (item of scroller.content(); track item) {
                <div
                    class="card"
                    [class.card--red]="!scroller.intersections().at($index)?.isIntersecting"
                    [class.card--green]="scroller.intersections().at($index)?.isIntersecting"
                >
                    {{ item }}
                </div>
            }
        </ngx-scroller>
    `,
    styles: `
        .card {
            display: flex;
            color: white;
            width: 100%;
            aspect-ratio: 1;

            &--green {
                background-color: green;
            }

            &--red {
                background-color: red;
            }

            &--even {
                max-height: 200px;
                min-height: 200px;
            }

            &--odd {
                max-height: 400px;
                min-height: 400px;
            }
        }
        .column {
            display: flex;
            flex-direction: column;
            height: 700px;
            width: 200px;
            overflow: auto;
            padding: 0.5rem 0 1rem 0;
            gap: 0.5rem;
        }

        .row {
            display: flex;
            flex-direction: row;
            height: 200px;
            width: 700px;
            overflow: auto;
            padding: 0 0.5rem 0 1rem;
            gap: 0.5rem;
        }

        .grid {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            padding: 0.5rem;
            gap: 0.5rem;
        }
    `
})
class WrapperComponent {
    private element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    readonly batch = input(1, { transform: (value: number | string) => Number(value) >= 1 ? Math.round(Number(value)) : 1 });
    readonly container = input<Element>();
    readonly emit = input(false);
    readonly offset = input(0, { transform: (value: number | string) => Number(value) >= 0 ? Math.round(Number(value)) : 0 });
    readonly overflow = input(false, { transform: booleanAttribute });
    readonly root = input(this.element);
    readonly rootMargin = input<string>();
    readonly threshold = input<number | number[]>();
    readonly virtualize = input(false, { transform: booleanAttribute });

    readonly component = viewChild.required(NgxScrollerComponent);
    readonly elementRef = viewChild.required<NgxScrollerComponent, ElementRef<HTMLElement>>(NgxScrollerComponent, { read: ElementRef });

    readonly loading = signal(false);
    readonly items = signal(new Array(100).fill(0).map((_, index) => index));

    onFirst(): void {
        this.loading.set(true);
        setTimeout(() => {
            const first = this.items().at(0)! - 1;
            this.items.update((items) => new Array(100).fill(0).map((_, index) => first - index).reverse().concat(items));
            this.loading.set(false);
        }, 1000);
    }

    onLast(): void {
        this.loading.set(true);
        setTimeout(() => {
            const last = this.items().at(-1)! + 1;
            this.items.update((items) => items.concat(new Array(100).fill(0).map((_, index) => last + index)));
            this.loading.set(false);
        }, 1000);
    }
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
        component = fixture.componentInstance.component();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with 2 child elements', () => {
        fixture.detectChanges();
        // @ts-ignore
        expect(component.element.children.length).toBe(2);
    });

    it('should constrain the batch input', () => {
        fixture.componentRef.setInput('batch', -10);
        fixture.detectChanges();
        expect(component.batch()).toBe(1);
        fixture.componentRef.setInput('batch', 0);
        fixture.detectChanges();
        expect(component.batch()).toBe(1);
        fixture.componentRef.setInput('batch', 10);
        fixture.detectChanges();
        expect(component.batch()).toBe(10);
    });

    it('should constrain the offset input', () => {
        fixture.componentRef.setInput('offset', -10);
        fixture.detectChanges();
        expect(component.offset()).toBe(0);
        fixture.componentRef.setInput('offset', 10);
        fixture.detectChanges();
        expect(component.offset()).toBe(10);
    });
});
