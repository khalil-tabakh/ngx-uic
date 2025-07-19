import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, TemplateRef, WritableSignal, computed, contentChild, effect, inject, input, linkedSignal, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { ScrollerLoader } from '../../models/scroller-loader.model';
import { ScrollerType } from '../../models/scroller-type.model';

@Component({
    selector: 'ngx-scroller',
    imports: [CommonModule],
    templateUrl: './scroller.component.html',
    styleUrl: './scroller.component.scss'
})
export class NgxScrollerComponent<ScrollerItem> implements OnInit, OnDestroy {
    private destroyRef = inject(DestroyRef);
    private elementRef = inject(ElementRef) as ElementRef<HTMLElement>;

    readonly batch = input(1, { transform: (value: number | string) => Number(value) > 0 ? Number(value) : 1 });
    readonly loader = input.required<ScrollerLoader<ScrollerItem>>();
    readonly offset = input<number | string>(0);
    readonly remove = input<Observable<ScrollerItem | ScrollerItem[]>>();
    readonly reset = input<Observable<void>>();
    readonly retry = input<Observable<void>>();
    readonly threshold = input<number | number[]>(0);
    readonly type = input<ScrollerType>('unidirectional');

    readonly loaded = output<ScrollerItem[]>();
    readonly loading = output<boolean>();

    protected template = contentChild.required(TemplateRef);

    private items = signal<ScrollerItem[]>([]);
    private first = signal(0);
    private last = signal(0);
    private load = signal(true);

    protected content = computed(() => this.items().slice(this.first(), this.last()));

    private fetcher = linkedSignal({
        source: () => ({ load: this.load(), loader: this.loader() }),
        computation: (source, previous) => !source.load
            ? previous?.value ?? Promise.resolve([])
            : source.loader instanceof Function ? source.loader() : source.loader
    }) as WritableSignal<Exclude<ScrollerLoader<ScrollerItem>, Function>>;

    private load$ = effect(() => {
        const load = this.load();
        untracked(() => {
            this.loading.emit(load);
            if (!load) this.loaded.emit(this.items());
        });
    });
    private loading$ = effect((onCleanup) => {
        const fetcher = this.fetcher();
        if (this.load()) switch (true) {
            case fetcher instanceof Observable:
                untracked(() => {
                    const subscription = fetcher.subscribe((items) => this.addIems(items));
                    onCleanup(() => subscription.unsubscribe());
                });
                break;
            case fetcher instanceof Promise:
                untracked(() => fetcher.then((items) => this.addIems(items)));
                break;
            default:
                const loading = fetcher.isLoading();
                untracked(() => loading ? this.load.set(true) : this.addIems(fetcher.value()));
                break;
        }
    });

    private uniIntersection$ = new IntersectionObserver((entries) => {
        if (!entries[0]?.isIntersecting) return;
        const isFinal = this.last() === this.items().length;
        if (isFinal) this.load.set(true);
        else this.addContent(this.batch());
    }, {
        rootMargin: isNaN(Number(this.offset())) ? this.offset() as string || undefined : undefined,
        threshold: this.threshold()
    });

    private biIntersection$ = new IntersectionObserver((entries) => {
        const children = this.elementRef.nativeElement.children;
        const offset = this.getOffset();
        if (entries.length < children.length - 2 * offset) {
            this.biIntersection$.disconnect();
            for (let i = offset; i < children.length - offset; i++) this.biIntersection$.observe(children[i]);
            return;
        }
        if (entries.at(0)!.isIntersecting && entries.at(-1)!.isIntersecting) {
            this.addContent(1);
            return;
        }
        if (!entries.at(0)!.isIntersecting && !entries.at(-1)!.isIntersecting) return;
        const minContent = entries.filter((entry) => entry.isIntersecting).length;
        const isLast = entries.at(-1)!.isIntersecting;
        const isFinal = this.last() === this.items().length;
        if (isLast && isFinal) this.load.set(true);
        else {
            const batch = this.batch() - (this.content().length - minContent) + 1;
            const isShiftable = this.content().length > minContent + this.batch();
            if (isShiftable) this.shiftContent(isLast ? this.batch() : -this.batch());
            else this.addContent(isLast ? batch : -batch);
        }
    }, {
        rootMargin: isNaN(Number(this.offset())) ? this.offset() as string || undefined : undefined,
        threshold: this.threshold()
    });

    private mutation$ = new MutationObserver(() => {
        this.biIntersection$.disconnect();
        this.uniIntersection$.disconnect();
        const children = this.elementRef.nativeElement.children;
        if (!children.length) return;
        if (this.last() > this.items().length) {
            const batch = this.last() - this.items().length;
            if (batch > this.first()) {
                this.shiftContent(-this.first());
                this.last.update((last) => last - (batch - this.first()));
            } else this.shiftContent(-batch);
            return;
        }
        const offset = this.getOffset();
        if (this.type() === 'unidirectional') this.uniIntersection$.observe(children[children.length - 1 - offset]);
        else for (let i = offset; i < children.length - offset; i++) this.biIntersection$.observe(children[i]);
    });

    ngOnInit(): void {
        this.mutation$.observe(this.elementRef.nativeElement, { childList: true });
        this.remove()?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((removables) => {
            if (!(removables instanceof Array)) removables = [removables];
            this.items.update((items) => items.filter((item) => !removables.includes(item)));
            this.loaded.emit(this.items());
        });
        this.reset()?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.items.set([]);
            this.loaded.emit(this.items());
        });
        this.retry()?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.load.set(true)
            const fetcher = this.fetcher();
            if (fetcher instanceof Observable || fetcher instanceof Promise) return;
            fetcher.reload();
        });
    }

    ngOnDestroy(): void {
        this.biIntersection$.disconnect();
        this.mutation$.disconnect();
        this.uniIntersection$.disconnect();
    }

    private getOffset(): number {
        const middle = Math.ceil(this.content().length / 2) - 1;
        let offset = Math.round(Number(this.offset()));
        if (isNaN(offset) || offset < 0) offset = 0;
        if (offset > middle) offset = middle;
        return offset;
    }

    private addIems(array: ScrollerItem[]): void {
        if (array.length) this.items.update((items) => items.concat(array));
        if (this.type() === 'unidirectional' || !this.content().length) this.addContent(this.batch());
        else this.shiftContent(this.batch());
        this.load.set(false);
    }

    private addContent(batch: number): void {
        if (this.first() + batch < 0) batch = -this.first();
        if (this.last() + batch > this.items().length) batch = this.items().length - this.last();
        if (batch < 0) this.first.update((first) => first + batch);
        if (batch > 0) this.last.update((last) => last + batch);
    }

    private shiftContent(batch: number): void {
        if (this.first() + batch < 0) batch = -this.first();
        if (this.last() + batch > this.items().length) batch = this.items().length - this.last();
        this.first.update((first) => first + batch);
        this.last.update((last) => last + batch);
    }
}
