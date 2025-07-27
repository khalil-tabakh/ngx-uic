import { CommonModule } from '@angular/common';
import { Component, ElementRef, TemplateRef, afterRenderEffect, computed, contentChild, inject, input, linkedSignal, output } from '@angular/core';
import { batchAttribute, offsetAttribute } from '../../utils/transforms.util';

@Component({
    selector: 'ngx-scroller',
    imports: [CommonModule],
    templateUrl: './scroller.component.html',
    styleUrl: './scroller.component.scss'
})
export class NgxScrollerComponent {
    private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

    readonly batch = input(1, { transform: batchAttribute });
    readonly items = input.required<unknown[]>();
    readonly offset = input(0, { transform: offsetAttribute });
    readonly threshold = input<number | number[]>();

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

    protected content = computed(() => this.items().slice(this.start(), this.end()));

    private intersection$ = new IntersectionObserver((entries) => {
        switch (entries.length) {
            case 1:
                const children = Array.from(this.elementRef.nativeElement.children);
                const index = children.indexOf(entries[0].target);
                const isLast = children.length - 1 - index <= index;
                if (isLast) {
                    if (entries[0].isIntersecting && this.end() >= this.items().length) this.last.emit();
                    else if (entries[0].isIntersecting) this.updateContent(this.batch());
                } else {
                    if (entries[0].isIntersecting && this.start() <= 0) this.first.emit();
                    else if (entries[0].isIntersecting) this.updateContent(-this.batch());
                }
                break;
            case 2:
                if (entries[0].isIntersecting && entries[1].isIntersecting) {
                    if (this.end() >= this.items().length) this.last.emit();
                    else this.updateContent(1);
                } else {
                    if (entries[0].isIntersecting) this.updateContent(-this.batch());
                    else if (entries[1].isIntersecting) this.updateContent(this.batch());
                }
                break;
        }
    }, {
        rootMargin: typeof this.offset() === 'string' ? this.offset() as string : undefined,
        threshold: this.threshold()
    });

    private observeContent$ = afterRenderEffect((onCleanup) => {
        if (!this.items().length) return;
        const children = this.elementRef.nativeElement.children;
        const half = Math.ceil(this.content().length / 2) - 1;
        let offset = Number(this.offset()) || 0;
        if (offset > half) offset = half;
        this.intersection$.observe(children[offset]);
        this.intersection$.observe(children[children.length - 1 - offset]);
        onCleanup(() => this.intersection$.disconnect());
    });

    private updateContent(batch: number): void {
        if (this.start() + batch < 0) batch = -this.start();
        if (this.end() + batch > this.items().length) batch = this.items().length - this.end();
        if (batch < 0) this.start.update((start) => start + batch);
        if (batch > 0) this.end.update((end) => end + batch);
    }
}
