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
    readonly items = input.required<Item[]>();
    readonly offset = input(0, { transform: offsetAttribute });
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
    private firstOffset = computed(() => Math.min(this.firstIndex(), this.getOffset('findIndex')));
    private lastIndex = computed(() => this.intersections().findLastIndex((intersection) => intersection.isIntersecting));
    private lastOffset = computed(() => Math.max(this.lastIndex(), this.getOffset('findLastIndex')));

    private intersection$ = linkedSignal<{ rootMargin?: string, threshold?: number | number[] }, IntersectionObserver>({
        source: () => ({ rootMargin: this.rootMargin(), offset: this.offset(), threshold: this.threshold() }),
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
                const template = this.style.gridAutoFlow.includes('row') ? this.style.gridTemplateColumns : this.style.gridTemplateRows;
                const tracks = this.style.display.includes('grid') ? template.split(' ').length : 1;
                if (this.lastIndex() >= this.lastOffset()) {
                    const batch = reobserved ? this.lastIndex() - this.lastOffset() + tracks : this.batch() * tracks;
                    const firstBatch = Math.max(0, this.firstIndex() - this.firstOffset() - 1);
                    const lastBatch = Math.min(batch, this.items().length - this.end());
                    if (this.end() < this.items().length) this.end.update((end) => end + lastBatch);
                    else if (this.emittable) this.emittable = Boolean(this.last.emit());
                    if (this.virtualize()) this.start.update((start) => start + firstBatch);
                }
                if (this.firstIndex() <= this.firstOffset()) {
                    const batch = reobserved ? this.firstOffset() - this.firstIndex() + tracks : this.batch() * tracks;
                    const firstBatch = Math.min(batch, this.start());
                    const lastBatch = Math.max(0, this.lastOffset() - this.lastIndex() - 1);
                    if (this.start() > 0) this.start.update((start) => start - firstBatch);
                    else if (this.emittable && this.initialized) this.emittable = Boolean(this.first.emit());
                    if (this.virtualize()) this.end.update((end) => end - lastBatch);
                }
                // Unshift content
                if (!this.intersections()[0].isIntersecting) return;
                const child = this.intersections()[0].target as HTMLElement;
                const { scrollLeft, scrollTop } = this.element;
                afterNextRender({
                    earlyRead: () => this.style.flexDirection,
                    write: (direction) => { // Handle reversed flex layout
                        const position: ScrollLogicalPosition = direction.includes('reverse') ? 'end' : 'start';
                        child.scrollIntoView({ behavior: 'instant', block: position, inline: position });
                        this.element.scrollBy({ behavior: 'instant', left: scrollLeft, top: scrollTop });
                    }
                }, { injector: this.injector });
            }, {
                root: this.element,
                rootMargin: current.rootMargin,
                threshold: current.threshold
            });
        }
    });

    private enableEmitters$ = effect(() => this.emittable = Boolean(this.items()));

    private observeContent$ = afterRenderEffect({
        earlyRead: () => (this.style = getComputedStyle(this.element)),
        read: (_, onCleanup) => {
            for (let i = 0; i < this.content().length; ++i) this.intersection$().observe(this.element.children[i]);
            onCleanup(() => this.intersection$().disconnect());
        }
    });

    private getOffset(finder: 'findIndex' | 'findLastIndex'): number {
        const reversed = this.style.flexDirection.includes('reverse');
        const position = this.element.scrollWidth > this.element.clientWidth ? 'top' : 'left';
        const size = this.element.scrollWidth > this.element.clientWidth ? 'height' : 'width';
        let offset = this.offset();
        return this.intersections()[finder]((intersection, index, intersections) => {
            const currentMesures = intersection.boundingClientRect;
            const nextMesures = intersections[index + 1]?.boundingClientRect;
            if (!nextMesures) return true;
            return reversed
                ? Math.floor(nextMesures[position]) > Math.ceil(currentMesures[position] - currentMesures[size]) && !offset--
                : Math.ceil(nextMesures[position]) < Math.floor(currentMesures[position] + currentMesures[size]) && !offset--;
        });
    }
}
