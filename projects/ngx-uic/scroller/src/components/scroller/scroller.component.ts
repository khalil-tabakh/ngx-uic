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

    private intersections = { first: null as IntersectionObserverEntry | null, last: null as IntersectionObserverEntry | null };
    private offsetable = false;
    private shiftable = false;
    private virtualizable = false;

    private intersection$ = new IntersectionObserver((entries) => {
        switch (entries.length) {
            case 1:
                if (entries[0].target === this.intersections.first?.target) {
                    if (entries[0].isIntersecting && this.start() <= 0) this.first.emit();
                    else if (entries[0].isIntersecting) this.updateContent(-this.batch());
                    this.intersections.first = entries[0];
                } else {
                    if (entries[0].isIntersecting && this.end() >= this.items().length) this.last.emit();
                    else if (entries[0].isIntersecting) this.updateContent(this.batch());
                    this.intersections.last = entries[0];
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
        this.offsetable ||= !this.intersections.last!.isIntersecting && !this.intersections.first!.isIntersecting;
        this.shiftable ||= !this.intersections.last!.isIntersecting;
        this.virtualizable ||= Array.from(this.elementRef.nativeElement.children).indexOf(this.intersections.first!.target) >= (Number(this.offset()) || 0);
    }, {
        rootMargin: typeof this.offset() === 'string' ? this.offset() as string : undefined,
        threshold: this.threshold()
    });

    private unshiftContent$ = effect(() => this.content().length && untracked(() => {
        const intersection = this.reverse() ? this.intersections.last : this.intersections.first;
        if (!intersection?.isIntersecting) return;
        const child = intersection.target as HTMLElement;
        const left = this.shiftable
            ? this.elementRef.nativeElement.scrollLeft - child.offsetLeft
            : this.elementRef.nativeElement.scrollWidth * (this.reverse() ? 1 : -1);
        const top = this.shiftable
            ? this.elementRef.nativeElement.scrollTop - child.offsetTop
            : this.elementRef.nativeElement.scrollHeight * (this.reverse() ? 1 : -1);
        afterNextRender({
            write: () => {
                if (this.shiftable) {
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
        read: (_, onCleanup) => {
            if (!this.content().length) return;
            const children = this.elementRef.nativeElement.children;
            let offset = Number(this.offset()) || 0;
            if (offset > children.length - 2) offset = children.length - 2 >= 0 ? children.length - 2 : 0;
            const first = this.reverse() ? children[children.length - 1 - offset] : children[this.offsetable ? offset : 0];
            const last = this.reverse() ? children[this.offsetable ? offset : 0] : children[children.length - 1 - offset];
            this.intersection$.observe(first);
            this.intersection$.observe(last);
            onCleanup(() => this.intersection$.disconnect());
        }
    });

    private updateContent(batch: number, virtualize = this.virtualize() && this.virtualizable): void {
        if (this.start() + batch < 0) batch = -this.start();
        if (this.end() + batch > this.items().length) batch = this.items().length - this.end();
        if (batch < 0 || (virtualize && !this.intersections.first?.isIntersecting)) this.start.update((start) => start + batch);
        if (batch > 0 || (virtualize && !this.intersections.last?.isIntersecting)) this.end.update((end) => end + batch);
    }
}
