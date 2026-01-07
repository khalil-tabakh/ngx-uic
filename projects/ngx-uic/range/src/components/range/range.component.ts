import { ChangeDetectionStrategy, Component, ElementRef, Renderer2, computed, inject, input, linkedSignal, output, viewChild, viewChildren } from '@angular/core';
import { NgxSegmentDirective } from '../../directives/segment/segment.directive';
import { RangeChange } from '../../models/range-change.model';
import { RangeType } from '../../models/range-type.model';
import { closest } from '../../utils/functions.util';
import { marksAttribute, offsetAttribute, splitsAttribute, stepAttribute, valueAttribute } from '../../utils/transforms.util';

@Component({
    selector: 'ngx-range',
    imports: [NgxSegmentDirective],
    templateUrl: './range.component.html',
    styleUrl: './range.component.scss',
    host: { '(pointerdown)': 'onClick($event)' },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxRangeComponent {
    private elementRef = inject(ElementRef);
    private renderer = inject(Renderer2);

    readonly type = input<RangeType>('simple');
    readonly min = input(0, { transform: (value: number | string) => !isNaN(Number(value)) ? Number(value) : 0 });
    readonly max = input(100, { transform: (value: number | string) => Number(value) > this.min() ? Number(value) : this.min() + 100 });
    readonly offset = input(1, { transform: (value: number | string) => offsetAttribute(value, this.min(), this.max()) });
    readonly origin = input(0, { transform: (value: number | string) => valueAttribute(value, this.min(), this.max(), 0) });
    readonly lower = input(25, { transform: (value: number | string) => valueAttribute(value, this.min(), this.max(), 25) });
    readonly value = input(50, { transform: (value: number | string) => valueAttribute(value, this.min(), this.max(), 50) });
    readonly upper = input(75, { transform: (value: number | string) => valueAttribute(value, this.min(), this.max(), 75) });
    readonly step = input([], { transform: (value: number | number[] | string) => stepAttribute(value, this.min(), this.max()) });
    readonly splits = input([], { transform: (values: number[]) => splitsAttribute(values, this.min(), this.max()) });
    readonly marks = input(null, { transform: (values: number[]) => marksAttribute(values, this.min(), this.max(), this.step()) });

    readonly change = output<RangeChange>();
    readonly input = output<number>();

    readonly segments = viewChildren(NgxSegmentDirective);
    readonly segmentRefs = viewChildren<NgxSegmentDirective, ElementRef<HTMLElement>>(NgxSegmentDirective, { read: ElementRef });
    readonly sliderRef = viewChild.required<ElementRef<HTMLElement>>('sliderRef');
    readonly thumbRefs = viewChildren<ElementRef<HTMLElement>>('thumbRef');

    protected lowest = linkedSignal({
        source: () => ({ type: this.type(), min: this.min(), step: this.step(), max: this.max(), lower: this.lower() }),
        computation: ({ type, min, step, max, lower }) => {
            if (type === 'simple') return min;
            const mapped = lower < min || lower > max ? min : lower;
            const rounded = closest(mapped, step);
            return rounded;
        }
    });
    protected highest = linkedSignal({
        source: () => ({ type: this.type(), min: this.min(), step: this.step(), max: this.max(), value: this.value(), upper: this.upper() }),
        computation: ({ type, min, step, max, value, upper }) => {
            let mapped = type === 'simple' ? value : upper;
            if (mapped < min) mapped = min;
            if (mapped > max) mapped = max;
            const rounded = closest(mapped, step);
            return rounded;
        }
    });

    protected low = computed(() => this.type() === 'simple' ? null : (this.lowest() - this.min()) / (this.max() - this.min()) * 100);
    protected high = computed(() => (this.highest() - this.min()) / (this.max() - this.min()) * 100);

    private emitValue(value: number): void {
        const event: RangeChange = this.type() === 'simple'
            ? { value: this.highest() }
            : { lower: this.lowest(), upper: this.highest() };
        this.change.emit(event);
        this.input.emit(value);
    }

    private setValue(offsetX: number, thumb: HTMLElement): void {
        let percentage = offsetX / this.sliderRef().nativeElement.offsetWidth * 100;
        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;
        const mapped = (this.max() - this.min()) * percentage / 100 + this.min();
        const rounded = closest(mapped, this.step());
        if (thumb === this.thumbRefs()[0].nativeElement) this.lowest.set(rounded);
        if (thumb === this.thumbRefs()[1].nativeElement) this.highest.set(rounded);
        this.emitValue(rounded);
    }

    protected onClick(event: PointerEvent): void {
        const slider = this.sliderRef().nativeElement;
        slider.dispatchEvent(new PointerEvent('pointerdown', event));
    }

    protected onPressing(event: KeyboardEvent): void {
        if (event.key === 'Tab') return;
        event.preventDefault();
        const thumbs = this.thumbRefs().map((thumbRef) => thumbRef.nativeElement);
        const value = event.target === thumbs[0] ? this.lowest : this.highest;
        const index = this.step().indexOf(value());
        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowLeft': {
                const step = index > 0 ? this.step().at(index - 1) : undefined;
                const newValue = Math.max(step ?? (value() - this.offset()), this.min());
                const signal = newValue < this.lowest() ? this.lowest : value;
                const oldValue = signal();
                signal.set(newValue);
                if (newValue !== oldValue) this.emitValue(signal());
                if (signal !== value) thumbs.find((thumb) => thumb !== event.target)?.focus();
                break;
            }
            case 'ArrowRight':
            case 'ArrowUp': {
                const step = index > -1 ? this.step().at(index + 1) : undefined;
                const newValue = Math.min(step ?? (value() + this.offset()), this.max());
                const signal = newValue > this.highest() ? this.highest : value;
                const oldValue = signal();
                signal.set(newValue);
                if (newValue !== oldValue) this.emitValue(signal());
                if (signal !== value) thumbs.find((thumb) => thumb !== event.target)?.focus();
                break;
            }
        }
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
