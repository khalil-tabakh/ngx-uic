import { Directive, ElementRef, Renderer2, RendererStyleFlags2, afterRenderEffect, computed, inject, input } from '@angular/core';

@Directive({
    selector: '[ngxSegment]',
    exportAs: 'ngxSegment',
})
export class NgxSegmentDirective {
    private element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private renderer = inject(Renderer2);

    readonly bounds = input.required<[number, number, number, number]>();
    readonly split = input.required<number>();
    readonly splits = input.required<number[]>();

    readonly segment = computed(() => {
        const trackStyle = getComputedStyle(this.element.parentElement!);
        const trackPaddingLeft = parseFloat(trackStyle.paddingLeft);
        const trackPaddingRight = parseFloat(trackStyle.paddingRight);
        const trackWidth = this.element.parentElement!.clientWidth - (trackPaddingLeft + trackPaddingRight);
        const segmentLeft = this.element.offsetLeft - trackPaddingLeft;
        const segmentWidth = this.element.clientWidth;
        const min = this.bounds()[0];
        const max = this.bounds()[3];
        const length = max - min;
        const start = length * segmentLeft / trackWidth + min;
        const end = length * (segmentLeft + segmentWidth) / trackWidth + min;
        return { start, end };
    });

    private low = computed(() => {
        const length = this.segment().end - this.segment().start;
        const lowest = this.bounds()[1];
        if (lowest < this.segment().start) return 0;
        if (lowest > this.segment().end) return 100;
        return (lowest - this.segment().start) / length * 100;
    });
    private high = computed(() => {
        const length = this.segment().end - this.segment().start;
        const highest = this.bounds()[2];
        if (highest < this.segment().start) return 0;
        if (highest > this.segment().end) return 100;
        return (highest - this.segment().start) / length * 100;
    });
    private width = computed(() => {
        const min = this.bounds()[0];
        const max = this.bounds()[3];
        const length = max - min;
        const index = this.splits().indexOf(this.split());
        const previous = !this.splits().length || index === 0 ? min : index === -1 ? this.splits().at(-1)! : this.splits().at(index - 1)!;
        const size = this.split() - previous;
        return size / length * 100;
    });

    private low$ = afterRenderEffect({
        write: () => this.renderer.setStyle(this.element, '--low', this.low(), RendererStyleFlags2.DashCase)
    });
    private high$ = afterRenderEffect({
        write: () => this.renderer.setStyle(this.element, '--high', this.high(), RendererStyleFlags2.DashCase)
    });
    private width$ = afterRenderEffect({
        write: () => this.renderer.setStyle(this.element, '--width', this.width(), RendererStyleFlags2.DashCase)
    });
}
