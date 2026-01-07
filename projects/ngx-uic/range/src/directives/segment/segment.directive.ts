import { Directive, ElementRef, Renderer2, RendererStyleFlags2, afterRenderEffect, computed, effect, inject, input } from '@angular/core';

@Directive({
    selector: '[ngxSegment]',
    exportAs: 'ngxSegment',
})
export class NgxSegmentDirective {
    private element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private renderer = inject(Renderer2);

    readonly min = input.required<number>();
    readonly lowest = input.required<number>();
    readonly highest = input.required<number>();
    readonly max = input.required<number>();
    readonly split = input.required<number>();
    readonly splits = input.required<number[]>();

    readonly segment = computed(() => {
        const trackStyle = getComputedStyle(this.element.parentElement!);
        const trackPaddingLeft = parseFloat(trackStyle.paddingLeft);
        const trackPaddingRight = parseFloat(trackStyle.paddingRight);
        const trackWidth = this.element.parentElement!.clientWidth - (trackPaddingLeft + trackPaddingRight);
        const segmentLeft = this.element.offsetLeft - trackPaddingLeft;
        const segmentWidth = this.element.clientWidth;
        const length = this.max() - this.min();
        const start = length * segmentLeft / trackWidth + this.min();
        const end = length * (segmentLeft + segmentWidth) / trackWidth + this.min();
        return { start, end };
    });
    private width = computed(() => {
        const index = this.splits().indexOf(this.split());
        const previous = index === 0 ? this.min() : index === -1 ? (this.splits().at(-1) ?? this.min()) : this.splits().at(index - 1)!;
        const length = this.max() - this.min();
        const size = this.split() - previous;
        return size / length * 100;
    });

    private width$ = effect(() => this.renderer.setStyle(this.element, '--width', this.width(), RendererStyleFlags2.DashCase));

    private low$ = afterRenderEffect({
        earlyRead: () => this.segment(),
        write: (segment) => {
            const low = this.toPercentage(this.lowest(), segment().start, segment().end);
            this.renderer.setStyle(this.element, '--low', low, RendererStyleFlags2.DashCase);
        }
    });
    private high$ = afterRenderEffect({
        earlyRead: () => this.segment(),
        write: (segment) => {
            const high = this.toPercentage(this.highest(), segment().start, segment().end);
            this.renderer.setStyle(this.element, '--high', high, RendererStyleFlags2.DashCase);
        }
    });

    private toPercentage(value: number, min: number, max: number): number {
        if (value < min) return 0;
        if (value > max) return 100;
        return (value - min) / (max - min) * 100;
    }
}
