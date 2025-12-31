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
        const max = this.bounds()[3];
        const start = max * segmentLeft / trackWidth;
        const end = max * (segmentLeft + segmentWidth) / trackWidth;
        return { start, end };
    });

    private low = computed(() => {
        const length = this.segment().end - this.segment().start;
        const lowest = this.bounds()[1];
        return lowest < this.segment().start ? 0 : lowest < this.segment().end ? (lowest - this.segment().start) / length * 100 : 100;
    });
    private high = computed(() => {
        const length = this.segment().end - this.segment().start;
        const highest = this.bounds()[2];
        return highest < this.segment().start ? 0 : highest < this.segment().end ? (highest - this.segment().start) / length * 100 : 100;
    });

    private width = computed(() => {
        const index = this.splits().indexOf(this.split());
        const previous = !this.splits().length || index === 0 ? 0 : index === -1 ? this.splits().at(-1)! : this.splits().at(index - 1)!;
        const length = this.split() - previous;
        return length / this.bounds()[3] * 100;
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
