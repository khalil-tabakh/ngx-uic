import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, afterRenderEffect, booleanAttribute, computed, effect, inject, input, linkedSignal, output, signal } from '@angular/core';
import { batchAttribute, offsetAttribute } from '../../utils/transforms.util';

@Component({
    selector: 'ngx-scroller',
    templateUrl: './scroller.component.html',
    styleUrl: './scroller.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxScrollerComponent<Item> {
    private element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private injector = inject(Injector);

    readonly batch = input(1, { transform: batchAttribute });
    readonly container = input<Element>(this.element);
    readonly items = input.required<Item[]>();
    readonly offset = input(0, { transform: offsetAttribute });
    readonly root = input(this.element);
    readonly rootMargin = input<string>();
    readonly threshold = input<number | number[]>();
    readonly virtualize = input(false, { transform: booleanAttribute });

    readonly first = output<void>();
    readonly last = output<void>();

    private emittable = false;
    private initialized = false;
    private style!: CSSStyleDeclaration;

    private entries = signal(new Map<Element, IntersectionObserverEntry>());

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
    private firstOffset = computed(() => Math.min(this.firstIndex(), this.getItemsCount(1, this.offset()) - 1));
    private lastIndex = computed(() => this.intersections().findLastIndex((intersection) => intersection.isIntersecting));
    private lastOffset = computed(() => Math.max(this.lastIndex(), this.intersections().length - this.getItemsCount(-1, this.offset())));

    private intersection$ = linkedSignal<{ root: HTMLElement, rootMargin?: string, threshold?: number | number[] }, IntersectionObserver>({
        source: () => ({ root: this.root(), rootMargin: this.rootMargin(), offset: this.offset(), threshold: this.threshold() }),
        computation: (current, previous) => {
            previous?.value.disconnect();
            return new IntersectionObserver((intersections) => {
                const reobserved = intersections.length === this.content().length;
                if (reobserved) this.entries.set(new Map(intersections.map((entry) => [entry.target, entry])));
                else this.entries.update((entries) => {
                    return new Map(intersections.reduce((entries, entry) => entries.set(entry.target, entry), entries));
                });
                this.initialized ||= this.firstIndex() > this.firstOffset();
                // Update content
                const oldStart = this.start();
                const template = this.style.gridAutoFlow.includes('row') ? this.style.gridTemplateColumns : this.style.gridTemplateRows;
                if (this.lastIndex() >= this.lastOffset()) {
                    const count = this.style.display.includes('grid') ? template.split(' ').length : this.getItemsCount(-1, 0);
                    const batch = reobserved ? count : this.batch() * count;
                    const firstBatch = Math.max(0, this.firstIndex() - this.firstOffset() - 1);
                    const lastBatch = Math.min(batch, this.items().length - this.end());
                    if (this.end() < this.items().length) this.end.update((end) => end + lastBatch);
                    else if (this.emittable) this.emittable = Boolean(this.last.emit());
                    if (this.virtualize()) this.start.update((start) => start + firstBatch);
                }
                if (this.firstIndex() <= this.firstOffset()) {
                    const count = this.style.display.includes('grid') ? template.split(' ').length : this.getItemsCount(1, 0);
                    const batch = reobserved ? count : this.batch() * count;
                    const firstBatch = Math.min(batch, this.start());
                    const lastBatch = Math.max(0, this.lastOffset() - this.lastIndex() - 1);
                    if (this.start() > 0) this.start.update((start) => start - firstBatch);
                    else if (this.emittable && this.initialized) this.emittable = Boolean(this.first.emit());
                    if (this.virtualize()) this.end.update((end) => end - lastBatch);
                }
                const newStart = this.start();
                // Unshift content
                if (newStart === oldStart) return;
                const index = newStart > oldStart ? newStart - oldStart : 0;
                const anchor = this.intersections()[index].target as HTMLElement;
                const { offsetLeft: oldOffsetLeft, offsetTop: oldOffsetTop } = anchor;
                const { scrollLeft: oldScrollLeft, scrollTop: oldScrollTop } = current.root;
                afterNextRender({
                    earlyRead: () => ({
                        newOffsetLeft: anchor.offsetLeft,
                        newOffsetTop: anchor.offsetTop,
                        newScrollLeft: current.root.scrollLeft,
                        newScrollTop: current.root.scrollTop
                    }),
                    write: ({ newOffsetLeft, newOffsetTop, newScrollLeft, newScrollTop }) => current.root.scrollBy({
                        behavior: 'instant',
                        left: (newOffsetLeft - oldOffsetLeft) - (newScrollLeft - oldScrollLeft),
                        top: (newOffsetTop - oldOffsetTop) - (newScrollTop - oldScrollTop)
                    })
                }, { injector: this.injector });
            }, { root: current.root, rootMargin: current.rootMargin, threshold: current.threshold });
        }
    });

    private enableEmitters$ = effect(() => this.emittable = Boolean(this.items()));

    private observeContent$ = afterRenderEffect({
        earlyRead: () => (this.style = getComputedStyle(this.container())),
        read: (_, onCleanup) => {
            for (let i = 0; i < this.content().length; ++i) this.intersection$().observe(this.container().children[i]);
            onCleanup(() => this.intersection$().disconnect());
        }
    });

    private getItemsCount(direction: 1 | -1, tracks: number): number {
        const finder = direction === 1 ? 'findIndex' : 'findLastIndex';
        const reversed = this.style.flexDirection.includes('reverse');
        const position = this.root().scrollWidth > this.root().clientWidth ? 'top' : 'left';
        const size = this.root().scrollWidth > this.root().clientWidth ? 'height' : 'width';
        const index = this.intersections()[finder]((intersection, index, intersections) => {
            const currentMesures = intersection.boundingClientRect;
            const nextMesures = intersections[index + direction]?.boundingClientRect;
            if (!nextMesures) return true;
            return Number(reversed) ^ Number(direction === -1)
                ? Math.floor(nextMesures[position] + nextMesures[size]) > Math.ceil(currentMesures[position]) && !tracks--
                : Math.floor(currentMesures[position] + currentMesures[size]) > Math.ceil(nextMesures[position]) && !tracks--;
        });
        return direction === -1 ? this.intersections().length - index : index + 1;
    }
}
