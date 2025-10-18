import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, afterRenderEffect, booleanAttribute, computed, effect, inject, input, linkedSignal, output, signal } from '@angular/core';
import { batchAttribute, offsetAttribute } from '../../utils/transforms.util';

@Component({
    selector: 'ngx-scroller',
    templateUrl: './scroller.component.html',
    styleUrl: './scroller.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxScrollerComponent<Item> {
    private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    private injector = inject(Injector);

    readonly batch = input(1, { transform: batchAttribute });
    readonly items = input.required<Item[]>();
    readonly offset = input(0, { transform: offsetAttribute });
    readonly threshold = input<number | number[]>();
    readonly virtualize = input(false, { transform: booleanAttribute });

    readonly first = output<void>();
    readonly last = output<void>();

    private emittable = false;
    private initialized = false;

    private entries = signal(new Map<Element, IntersectionObserverEntry>());
    private tracks = signal(1);

    private start = linkedSignal<Item[], number>({
        source: this.items,
        computation: (newItems, previous) => {
            const oldItems = previous?.source ?? newItems;
            const oldIndex = previous?.value as number ?? 0;
            const newIndex = newItems.indexOf(oldItems[oldIndex]);
            if (newIndex > -1) return newIndex;
            if (oldIndex < newItems.length) return oldIndex;
            if (newItems.length > 0) return newItems.length - 1;
            return 0;
        }
    });
    private end = linkedSignal<Item[], number>({
        source: this.items,
        computation: (newItems, previous) => {
            const oldItems = previous?.source ?? newItems;
            const oldIndex = previous?.value as number ?? 2;
            const newIndex = newItems.indexOf(oldItems[oldIndex]);
            if (newIndex > -1) return newIndex;
            if (oldIndex <= newItems.length) return oldIndex;
            if (newItems.length > 1) return newItems.length;
            return 2;
        }
    });

    readonly content = computed<readonly Item[]>(() => this.items().slice(this.start(), this.end()));
    readonly intersections = computed<readonly IntersectionObserverEntry[]>(() => this.entries().values().toArray());

    private firstIndex = computed(() => this.intersections().findIndex((intersection) => intersection.isIntersecting));
    private firstOffset = computed(() => {
        const offset = this.tracks() > 1
            ? (Number(this.offset()) || 1) * this.tracks() - 1
            : (Number(this.offset()) || 0);
        const lastOffset = this.content().length - 1 - offset;
        return offset < lastOffset ? offset : lastOffset > 0 ? lastOffset - 1 : 0;
    });
    private lastIndex = computed(() => this.intersections().findLastIndex((intersection) => intersection.isIntersecting));
    private lastOffset = computed(() => {
        const offset = this.tracks() > 1
            ? (Number(this.offset()) || 1) * this.tracks() - 1
            : (Number(this.offset()) || 0);
        const lastOffset = this.content().length - 1 - offset;
        return lastOffset > 1 ? lastOffset : this.content().length > 1 ? 1 : 0;
    });

    private intersection$ = linkedSignal<{ offset: number | string, threshold?: number | number[] }, IntersectionObserver>({
        source: () => ({ offset: this.offset(), threshold: this.threshold() }),
        computation: (current, previous) => {
            previous?.value.disconnect();
            return new IntersectionObserver((intersections) => {
                if (intersections.length === this.content().length) this.entries.set(new Map(intersections.map(intersection => [intersection.target, intersection])));
                else this.entries.update((entries) => new Map(intersections.reduce((entries, intersection) => entries.set(intersection.target, intersection), entries)));
                this.initialized ||= this.firstIndex() > this.firstOffset();
                // Update content
                switch (true) {
                    case this.lastIndex() >= this.lastOffset():
                        if (this.end() < this.items().length) {
                            const batch = intersections.length === this.content().length ? this.lastIndex() - this.lastOffset() + 1 : this.batch();
                            const firstBatch = this.firstIndex() - 1 > this.firstOffset() ? this.firstIndex() - 1 - this.firstOffset() : 0;
                            const lastBatch = this.end() + batch > this.items().length ? this.items().length - this.end() : batch;
                            this.end.update((end) => end + lastBatch);
                            if (this.virtualize()) this.start.update((start) => start + firstBatch);
                        } else if (this.emittable) this.emittable = Boolean(this.last.emit());
                        break;
                    case this.firstIndex() <= this.firstOffset():
                        if (this.start() > 0) {
                            const batch = intersections.length === this.content().length ? this.firstIndex() - this.firstOffset() - 1 : -this.batch();
                            const firstBatch = this.start() + batch < 0 ? -this.start() : batch;
                            const lastBatch = this.lastIndex() + 1 < this.lastOffset() ? this.lastIndex() + 1 - this.lastOffset() : 0;
                            this.start.update((start) => start + firstBatch);
                            if (this.virtualize()) this.end.update((end) => end + lastBatch);
                        } else if (this.emittable && this.initialized) this.emittable = Boolean(this.first.emit());
                        break;
                }
                // Unshift content
                if (!this.intersections()[0].isIntersecting) return;
                const child = this.intersections()[0].target as HTMLElement;
                const { scrollLeft, scrollTop } = this.elementRef.nativeElement;
                afterNextRender({
                    earlyRead: () => getComputedStyle(this.elementRef.nativeElement).flexDirection,
                    write: (direction) => { // Handle reversed flex layout
                        const position: ScrollLogicalPosition = direction.includes('reverse') ? 'end' : 'start';
                        child.scrollIntoView({ behavior: 'instant', block: position, inline: position });
                        this.elementRef.nativeElement.scrollBy({ behavior: 'instant', left: scrollLeft, top: scrollTop });
                    }
                }, { injector: this.injector });
            }, {
                rootMargin: typeof current.offset === 'string' ? current.offset : undefined,
                threshold: current.threshold
            });
        }
    });

    private enableEmitters$ = effect(() => this.emittable = Boolean(this.items()));

    private observeContent$ = afterRenderEffect({
        earlyRead: (onCleanup) => { // Handle dynamic grid layout
            const style = getComputedStyle(this.elementRef.nativeElement);
            if (!style.display.includes('grid')) return;
            const resize$ = new ResizeObserver(() => {
                const tracks = style.gridAutoFlow.includes('row')
                    ? style.gridTemplateColumns.split(' ').length
                    : style.gridTemplateRows.split(' ').length;
                this.tracks.set(tracks);
            });
            resize$.observe(this.elementRef.nativeElement);
            onCleanup(() => resize$.disconnect());
        },
        read: (_, onCleanup) => {
            for (let i = 0; i < this.content().length; ++i) this.intersection$().observe(this.elementRef.nativeElement.children[i]);
            onCleanup(() => this.intersection$().disconnect());
        }
    });
}
