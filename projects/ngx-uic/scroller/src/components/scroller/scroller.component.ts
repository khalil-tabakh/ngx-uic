import { CommonModule } from '@angular/common';
import { Component, ElementRef, Injector, TemplateRef, afterNextRender, afterRenderEffect, booleanAttribute, computed, contentChild, effect, inject, input, linkedSignal, output, untracked } from '@angular/core';
import { batchAttribute, offsetAttribute } from '../../utils/transforms.util';

@Component({
    selector: 'ngx-scroller',
    imports: [CommonModule],
    templateUrl: './scroller.component.html',
    styleUrl: './scroller.component.scss'
})
export class NgxScrollerComponent {
    private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    private injector = inject(Injector);

    readonly batch = input(1, { transform: batchAttribute });
    readonly items = input.required<unknown[]>();
    readonly offset = input(0, { transform: offsetAttribute });
    readonly reverse = input(false, { transform: booleanAttribute });
    readonly threshold = input<number | number[]>();
    readonly virtualize = input(false, { transform: booleanAttribute });

    readonly first = output<void>();
    readonly last = output<void>();

    protected template = contentChild.required(TemplateRef);

    private start = linkedSignal<unknown[], number>({
        source: this.items,
        computation: (newItems, previous) => {
            const oldItems = previous?.source ?? newItems;
            const oldIndex = previous?.value as number ?? 0;
            const newIndex = newItems.indexOf(oldItems[oldIndex]);
            return newIndex > -1 ? newIndex : oldIndex;
        }
    });
    private end = linkedSignal<unknown[], number>({
        source: this.items,
        computation: (newItems, previous) => {
            const oldItems = previous?.source ?? newItems;
            const oldIndex = previous?.value as number ?? 2;
            const newIndex = newItems.indexOf(oldItems[oldIndex]);
            return newIndex > -1 ? newIndex : oldIndex;
        }
    });

    protected content = computed(() => this.reverse()
        ? this.items().slice(this.start(), this.end()).reverse()
        : this.items().slice(this.start(), this.end())
    );

    private filled = false;
    private intersections = { first: null as IntersectionObserverEntry | null, last: null as IntersectionObserverEntry | null };
    private intersection$ = new IntersectionObserver((entries) => {
        switch (entries.length) {
            case 1:
                if (entries[0].target === this.intersections.last?.target) {
                    if (entries[0].isIntersecting && this.end() >= this.items().length) this.last.emit();
                    else if (entries[0].isIntersecting) this.updateContent(this.batch());
                    this.intersections.last = entries[0]
                } else {
                    if (entries[0].isIntersecting && this.start() <= 0) this.first.emit();
                    else if (entries[0].isIntersecting) this.updateContent(-this.batch());
                    this.intersections.first = entries[0]
                }
                break;
            case 2:
                if (entries[0].isIntersecting && entries[1].isIntersecting) {
                    if (this.end() >= this.items().length) this.last.emit();
                    else this.updateContent(1, false);
                } else {
                    if (entries[0].isIntersecting) this.updateContent(-this.batch());
                    else if (entries[1].isIntersecting) this.updateContent(this.batch());
                }
                this.intersections.first = entries[0];
                this.intersections.last = entries[1];
                break;
        }
        this.filled ||= !this.intersections.last!.isIntersecting;
    }, {
        rootMargin: typeof this.offset() === 'string' ? this.offset() as string : undefined,
        threshold: this.threshold()
    });

    private unshiftContent$ = effect(() => this.content().length && untracked(() => {
        const intersection = this.reverse() ? this.intersections.last : this.intersections.first;
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
        read: (onCleanup) => {
            if (!this.content().length) return;
            const children = this.elementRef.nativeElement.children;
            let offset = Number(this.offset()) || 0;
            if (offset > children.length - 2) offset = children.length - 2 >= 0 ? children.length - 2 : 0;
            if (this.reverse()) {
                this.intersection$.observe(children[children.length - 1 - offset]);
                this.intersection$.observe(children[offset]);
            } else {
                this.intersection$.observe(children[offset]);
                this.intersection$.observe(children[children.length - 1 - offset]);
            }
            onCleanup(() => this.intersection$.disconnect());
        }
    });
    private reverseContent$ = afterRenderEffect({
        earlyRead: () => getComputedStyle(this.elementRef.nativeElement).flexDirection,
        write: (direction) => {
            this.elementRef.nativeElement.classList.toggle('column', direction() === 'column-reverse');
            this.elementRef.nativeElement.classList.toggle('row', direction() === 'row-reverse');
            this.elementRef.nativeElement.classList.toggle('column--reverse', direction().includes('column') && this.reverse());
            this.elementRef.nativeElement.classList.toggle('row--reverse', direction().includes('row') && this.reverse());
        }
    });

    private updateContent(batch: number, virtualize = this.virtualize()): void {
        if (this.start() + batch < 0) batch = -this.start();
        if (this.end() + batch > this.items().length) batch = this.items().length - this.end();
        if (batch < 0 || (virtualize && !this.intersections.first?.isIntersecting)) this.start.update((start) => start + batch);
        if (batch > 0 || (virtualize && !this.intersections.last?.isIntersecting)) this.end.update((end) => end + batch);
    }
}
