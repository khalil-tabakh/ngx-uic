// Angular
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Renderer2, booleanAttribute, computed, inject, input, linkedSignal, output, viewChild, viewChildren } from '@angular/core';
// Lib
import { RangeChange } from '../../models/range-change.model';
import { RangeType } from '../../models/range-type.model';

@Component({
    selector: 'ngx-range',
    imports: [CommonModule],
    templateUrl: './range.component.html',
    styleUrl: './range.component.scss',
    host: { '(pointerdown)': 'onClick($event)' },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxRangeComponent {
    private elementRef = inject(ElementRef);
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

    private sliderRef = viewChild.required<ElementRef<HTMLElement>>('sliderRef');
    private thumbRefs = viewChildren<ElementRef<HTMLElement>>('thumbRef');

    protected lowest = linkedSignal({
        source: () => ({ min: this.min(), step: this.step(), max: this.max(), lower: this.lower() }),
        computation: ({ min, step, max, lower }) => {
            const mapped = lower < min || lower > max ? min : lower;
            const rounded = step ? Math.round(mapped / this.step()) * this.step() : mapped;
            return rounded;
        }
    });
    protected highest = linkedSignal({
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

    protected onClick(event: PointerEvent): void {
        const slider = this.sliderRef().nativeElement;
        slider.dispatchEvent(new PointerEvent('pointerdown', event));
    }

    protected onSliding(event: PointerEvent): void {
        event.stopPropagation();
        const range = this.elementRef.nativeElement;
        const slider = this.sliderRef().nativeElement;
        const thumbs = this.thumbRefs().map((thumbRef) => thumbRef.nativeElement);

        const thumbDistance = (thumb: HTMLElement) => Math.abs(event.offsetX - thumb.offsetLeft);
        let thumb = thumbDistance(thumbs[0]) < thumbDistance(thumbs[1]) ? thumbs[0] : thumbs[1];
        if (event.target === thumbs[0]) thumb = thumbs[0];
        if (event.target === thumbs[1] || this.type() === 'simple') thumb = thumbs[1];
        if (event.target === slider) this.setValue(event.offsetX, thumb);

        slider.setPointerCapture(event.pointerId);
        this.renderer.setStyle(range, 'cursor', 'grabbing');
        this.renderer.setStyle(thumb, 'cursor', 'grabbing');
        const onPointerMove = this.renderer.listen(slider, 'pointermove', (event: PointerEvent) => {
            if (event.offsetX < thumbs[0].offsetLeft) thumb = thumbs[0];
            if (event.offsetX > thumbs[1].offsetLeft || this.type() === 'simple') thumb = thumbs[1];
            this.setValue(event.offsetX, thumb);
        });
        const onPointerUp = this.renderer.listen(slider, 'pointerup', () => {
            this.renderer.setStyle(range, 'cursor', 'pointer');
            this.renderer.setStyle(thumb, 'cursor', 'grab');
            onPointerMove();
            onPointerUp();
        });
    }
}
