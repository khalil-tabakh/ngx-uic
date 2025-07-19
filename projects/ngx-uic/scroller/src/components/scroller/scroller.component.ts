import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, TemplateRef, contentChild, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subscription } from 'rxjs';

@Component({
    selector: 'ngx-scroller',
    imports: [CommonModule],
    templateUrl: './scroller.component.html',
    styleUrl: './scroller.component.scss'
})
export class NgxScrollerComponent implements OnInit, OnDestroy {
    private destroyRef = inject(DestroyRef);
    private elementRef = inject(ElementRef) as ElementRef<HTMLElement>;

    readonly batch = input(0);
    readonly loader = input.required<() => Observable<any[]> | Promise<any[]>>();
    readonly offset = input<number | string>(-1);
    readonly remove = input<Observable<any | any[]>>();
    readonly reset = input<Observable<void>>();
    readonly retry = input<Observable<void>>();
    readonly threshold = input<number | number[]>();

    readonly loaded = output<any[]>();
    readonly loading = output<boolean>();

    protected template = contentChild.required(TemplateRef);

    protected items = signal<any[]>([]);

    private intersection$ = new IntersectionObserver((entries) => {
        const child = entries[0];
        if (!child.isIntersecting) return;
        this.buffer.length ? this.appendItems() : this.loadItems();
        this.intersection$.unobserve(child.target);
    }, {
        rootMargin: isNaN(Number(this.offset())) ? this.offset() as string : undefined,
        threshold: this.threshold()
    });

    private mutation$ = new MutationObserver(() => {
        this.intersection$.disconnect();
        const children = this.elementRef.nativeElement.children;
        if (!children.length) return;
        let offset = Math.round(Number(this.offset()));
        if (isNaN(offset) || offset > -1) offset = -1;
        if (-offset > children.length) offset = -children.length;
        const child = children.item(children.length + offset)!;
        this.intersection$.observe(child);
    });

    private loaderSub?: Subscription;

    private buffer: any[] = [];

    ngOnInit(): void {
        this.mutation$.observe(this.elementRef.nativeElement, { childList: true });
        this.remove()?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((removables) => {
            if (!(removables instanceof Array)) removables = [removables];
            this.items.update((items) => items.filter((item) => !removables.includes(item)));
            this.loaded.emit(this.items());
        });
        this.reset()?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.buffer = [];
            this.items.set([]);
            this.loaded.emit(this.items());
        });
        this.retry()?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadItems()) || this.loadItems();
    }

    ngOnDestroy(): void {
        this.loaderSub?.unsubscribe();
        this.intersection$.disconnect();
        this.mutation$.disconnect();
    }

    private appendItems(): void {
        const batch = this.buffer.splice(0, this.batch() || this.buffer.length);
        this.items.update((items) => items.concat(batch));
        this.loaded.emit(this.items());
    }

    private loadItems(): void {
        this.loading.emit(true);
        const loader = this.loader()();
        switch (true) {
            case loader instanceof Observable:
                this.loaderSub?.unsubscribe();
                this.loaderSub = loader.subscribe((array) => {
                    this.buffer = array;
                    this.appendItems();
                    this.loading.emit(false);
                });
                break;
            case loader instanceof Promise:
                loader.then((array) => {
                    this.buffer = array;
                    this.appendItems();
                    this.loading.emit(false);
                });
                break;
        }
    }
}
