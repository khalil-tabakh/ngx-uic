import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, afterRenderEffect, booleanAttribute, computed, effect, inject, input, linkedSignal, output, signal, untracked } from '@angular/core';
import { batchAttribute, offsetAttribute } from '../../utils/transforms.util';

@Component({
    selector: 'ngx-scroller',
    imports: [CommonModule],
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
    readonly reverse = input(false, { transform: booleanAttribute });
    readonly threshold = input<number | number[]>();
    readonly virtualize = input(false, { transform: booleanAttribute });

    readonly first = output<void>();
    readonly last = output<void>();

    private emittable = false;
    private filled = false;
    private initialized = false;

    private entries = signal(new Map<Element, IntersectionObserverEntry>());

    private start = linkedSignal<Item[], number>({
        source: this.items,
        computation: (newItems, previous) => {
            const oldItems = previous?.source ?? newItems;
            const oldIndex = previous?.value as number ?? 0;
            const newIndex = newItems.indexOf(oldItems[oldIndex]);
            return newIndex > -1 ? newIndex : oldIndex;
        }
    });
    private end = linkedSignal<Item[], number>({
        source: this.items,
        computation: (newItems, previous) => {
            const oldItems = previous?.source ?? newItems;
            const oldIndex = previous?.value as number ?? 2;
            const newIndex = newItems.indexOf(oldItems[oldIndex]);
            return newIndex > -1 ? newIndex : oldIndex;
        }
    });

    readonly content = computed<readonly Item[]>(() => this.reverse()
        ? this.items().slice(this.start(), this.end()).reverse()
        : this.items().slice(this.start(), this.end())
    );
    readonly intersections = computed<readonly IntersectionObserverEntry[]>(() => this.entries().values().toArray());

    private firstIndex = computed(() => this.intersections().findIndex((intersection) => intersection.isIntersecting));
    private firstOffset = computed(() => {
        const offset = Number(this.offset()) || 0;
        const firstOffset = offset;
        const lastOffset = this.content().length - 1 - offset;
        return firstOffset < lastOffset ? firstOffset : lastOffset > 0 ? lastOffset - 1 : 0;
    });
    private lastIndex = computed(() => this.intersections().findLastIndex((intersection) => intersection.isIntersecting));
    private lastOffset = computed(() => {
        const offset = Number(this.offset()) || 0;
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
                this.filled ||= this.lastIndex() < this.content().length - 1;
                this.initialized ||= this.firstIndex() > this.firstOffset();
                switch (true) {
                    case this.lastIndex() >= this.lastOffset(): {
                        const batch = intersections.length === this.content().length ? this.lastIndex() - this.lastOffset() + 1 : this.batch();
                        const virtualize = intersections.length === this.content().length ? false : this.virtualize();
                        if (this.end() < this.items().length) {
                            const firstBatch = this.firstIndex() - 1 > this.firstOffset() ? this.firstIndex() - 1 - this.firstOffset() : 0;
                            const lastBatch = this.end() + batch > this.items().length ? this.items().length - this.end() : batch;
                            this.end.update((end) => end + lastBatch);
                            if (virtualize) this.start.update((start) => start + firstBatch);
                        } else if (this.emittable) this.emittable = Boolean(this.last.emit());
                        break;
                    }
                    case this.firstIndex() <= this.firstOffset(): {
                        const batch = intersections.length === this.content().length ? this.firstIndex() - this.firstOffset() - 1 : -this.batch();
                        const virtualize = intersections.length === this.content().length ? false : this.virtualize();
                        if (this.start() > 0) {
                            const firstBatch = this.start() + batch < 0 ? -this.start() : batch;
                            const lastBatch = this.lastIndex() + 1 < this.lastOffset() ? this.lastIndex() + 1 - this.lastOffset() : 0;
                            this.start.update((start) => start + firstBatch);
                            if (virtualize) this.end.update((end) => end + lastBatch);
                        } else if (this.emittable && this.initialized) this.emittable = Boolean(this.first.emit());
                        break;
                    }
                }
            }, {
                rootMargin: typeof current.offset === 'string' ? current.offset : undefined,
                threshold: current.threshold
            });
        }
    });

    private unblockEmitters$ = effect(() => this.emittable = Boolean(this.items()));
    private unshiftContent$ = effect(() => this.content().length && untracked(() => {
        const intersection = this.reverse() ? this.intersections().at(-1) : this.intersections().at(0);
        if (!intersection?.isIntersecting) return;
        const child = intersection.target as HTMLElement;
        const left = this.filled
            ? this.elementRef.nativeElement.scrollLeft - child.offsetLeft
            : this.elementRef.nativeElement.scrollWidth * (this.reverse() ? 1 : -1);
        const top = this.filled
            ? this.elementRef.nativeElement.scrollTop - child.offsetTop
            : this.elementRef.nativeElement.scrollHeight * (this.reverse() ? 1 : -1);
        afterNextRender({
            write: () => {
                if (this.filled) {
                    child.scrollIntoView({ behavior: 'instant', block: 'start', inline: 'start' });
                    this.elementRef.nativeElement.scrollBy({ behavior: 'instant', left: left, top: top });
                } else this.elementRef.nativeElement.scrollTo({ behavior: 'instant', left: left, top: top });
            }
        }, { injector: this.injector });
    }));

    private observeContent$ = afterRenderEffect({
        earlyRead: () => getComputedStyle(this.elementRef.nativeElement).flexDirection,
        write: (direction) => {
            this.elementRef.nativeElement.classList.toggle('column', direction() === 'column-reverse');
            this.elementRef.nativeElement.classList.toggle('row', direction() === 'row-reverse');
            this.elementRef.nativeElement.classList.toggle('column--reverse', direction().includes('column') && this.reverse());
            this.elementRef.nativeElement.classList.toggle('row--reverse', direction().includes('row') && this.reverse());
        },
        read: (_, onCleanup) => this.content().length && this.intersection$() && untracked(() => {
            const children = this.reverse()
                ? Array.from(this.elementRef.nativeElement.children).reverse()
                : Array.from(this.elementRef.nativeElement.children);
            for (const child of children) this.intersection$().observe(child);
            onCleanup(() => this.intersection$().disconnect());
        })
    });
}
