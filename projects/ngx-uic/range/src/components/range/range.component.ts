// Angular
import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Renderer2, afterRenderEffect, booleanAttribute, computed, inject, input, linkedSignal, output, viewChild, viewChildren } from '@angular/core';
// Lib
import { RangeChange } from '../../models/range-change.model';
import { RangeType } from '../../models/range-type.model';

@Component({
    selector: 'ngx-range',
    imports: [CommonModule],
    templateUrl: './range.component.html',
    styleUrl: './range.component.scss'
})
export class NgxRangeComponent {
    private renderer = inject(Renderer2);

    readonly type = input<RangeType>('simple');
    readonly min = input(0, { transform: (value: number | string) => isNaN(Number(value)) ? 0 : Number(value) });
    readonly lower = input(25, { transform: (value: number | string) => isNaN(Number(value)) ? 25 : Number(value) });
    readonly value = input(50, { transform: (value: number | string) => isNaN(Number(value)) ? 50 : Number(value) });
    readonly upper = input(75, { transform: (value: number | string) => isNaN(Number(value)) ? 75 : Number(value) });
    readonly max = input(100, { transform: (value: number | string) => isNaN(Number(value)) ? 100 : Number(value) });
    readonly step = input(1, { transform: (value: number | string) => isNaN(Number(value)) ? 1 : Number(value) });
    readonly marks = input(false, { transform: booleanAttribute });

    readonly change = output<RangeChange>();
    readonly input = output<number>();

    private readonly markRefs = viewChildren<ElementRef<HTMLElement>>('markRef');
    private readonly sliderRef = viewChild.required<ElementRef<HTMLElement>>('sliderRef');
    private readonly thumbRefs = viewChildren<ElementRef<HTMLElement>>('thumbRef');
    private readonly trackRef = viewChild.required<ElementRef<HTMLElement>>('trackRef');

    private lowest = linkedSignal({
        source: () => ({ min: this.min(), step: this.step(), max: this.max(), lower: this.lower() }),
        computation: ({ min, step, max, lower }) => {
            const mapped = lower < min || lower > max ? min : lower;
            const rounded = step ? Math.round(mapped / this.step()) * this.step() : mapped;
            return rounded;
        }
    });
    private highest = linkedSignal({
        source: () => ({ type: this.type(), min: this.min(), step: this.step(), max: this.max(), value: this.value(), upper: this.upper() }),
        computation: ({ type, min, step, max, value, upper }) => {
            let mapped = type === 'simple' ? value : upper;
            if (mapped < min) mapped = min;
            if (mapped > max) mapped = max;
            const rounded = step ? Math.round(mapped / this.step()) * this.step() : mapped;
            return rounded;
        }
    });

    protected low = computed(() => this.type() === 'simple' ? null : (this.lowest() - this.min()) / (this.max() - this.min()) * 100);
    protected high = computed(() => (this.highest() - this.min()) / (this.max() - this.min()) * 100);

    private updateMarksColor = afterRenderEffect(() => {
        this.lowest();
        this.highest();
        this.markRefs().map((markRef) => markRef.nativeElement).forEach((mark) => {
            switch (true) {
                case mark.offsetLeft > this.thumbRefs()[1].nativeElement.offsetLeft:
                    mark.style.background = 'var(--mark_color_upper, var(--mark_color))';
                    break;
                case mark.offsetLeft < this.thumbRefs()[1].nativeElement.offsetLeft && this.type() === 'simple':
                case mark.offsetLeft < this.thumbRefs()[0].nativeElement.offsetLeft:
                    mark.style.background = 'var(--mark_color_lower, var(--mark_color))';
                    break;
                default:
                    mark.style.background = 'var(--mark_color)';
                    break;
            }
        });
    });

    private setValue(offsetX: number, thumb: HTMLElement): void {
        let percentage = offsetX / this.sliderRef().nativeElement.offsetWidth * 100;
        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;
        const mapped = (this.max() - this.min()) * percentage / 100 + this.min();
        const rounded = this.step() ? Math.round(mapped / this.step()) * this.step() : mapped;
        if (thumb === this.thumbRefs()[0].nativeElement) this.lowest.set(rounded);
        if (thumb === this.thumbRefs()[1].nativeElement) this.highest.set(rounded);

        const event: RangeChange = this.type() === 'simple'
            ? { value: this.highest() }
            : { lower: this.lowest(), upper: this.highest() };
        this.change.emit(event);
        this.input.emit(rounded);
    }

    @HostListener('pointerdown', ['$event'])
    private onSliding(event: PointerEvent): void {
        const track = this.trackRef().nativeElement;
        const slider = this.sliderRef().nativeElement;
        const thumbs = this.thumbRefs().map((thumbRef) => thumbRef.nativeElement);

        const thumbDistance = (thumb: HTMLElement) => Math.abs(event.offsetX - thumb.offsetLeft);
        let thumb = thumbDistance(thumbs[0]) < thumbDistance(thumbs[1]) ? thumbs[0] : thumbs[1];
        if (event.target === thumbs[0]) thumb = thumbs[0];
        if (event.target === thumbs[1] || this.type() === 'simple') thumb = thumbs[1];
        if (event.target === slider || event.target === track) this.setValue(event.offsetX, thumb);

        slider.setPointerCapture(event.pointerId);
        this.renderer.setStyle(slider, 'cursor', 'grabbing');
        this.renderer.setStyle(thumb, 'cursor', 'grabbing');
        const onPointerMove = this.renderer.listen(slider, 'pointermove', (event: PointerEvent) => {
            if (event.offsetX < thumbs[0].offsetLeft) thumb = thumbs[0];
            if (event.offsetX > thumbs[1].offsetLeft) thumb = thumbs[1];
            this.setValue(event.offsetX, thumb);
        });
        const onPointerUp = this.renderer.listen(slider, 'pointerup', () => {
            this.renderer.setStyle(slider, 'cursor', 'pointer');
            this.renderer.setStyle(thumb, 'cursor', 'grab');
            onPointerMove();
            onPointerUp();
        });
    }
}
