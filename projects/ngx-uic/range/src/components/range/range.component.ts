import { ChangeDetectionStrategy, Component, ElementRef, Renderer2, computed, inject, input, linkedSignal, numberAttribute, output, viewChild, viewChildren } from '@angular/core';
import { NgxSegmentDirective } from '../../directives/segment/segment.directive';
import { RangeChange } from '../../models/range-change.model';
import { RangeType } from '../../models/range-type.model';
import { closest } from '../../utils/functions.util';
import { marksAttribute, maxAttribute, minAttribute, splitsAttribute, stepAttribute, valueAttribute } from '../../utils/transforms.util';

@Component({
    selector: 'ngx-range',
    imports: [NgxSegmentDirective],
    templateUrl: './range.component.html',
    styleUrl: './range.component.scss',
    host: { '(pointerdown)': 'onClick($event)' },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxRangeComponent {
    private element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private renderer = inject(Renderer2);

    readonly type = input<RangeType>('simple');
    readonly min = input(0, { transform: numberAttribute });
    readonly lower = input(25, { transform: numberAttribute });
    readonly value = input(50, { transform: numberAttribute });
    readonly upper = input(75, { transform: numberAttribute });
    readonly max = input(100, { transform: numberAttribute });
    readonly origin = input(0, { transform: numberAttribute });
    readonly offset = input(1, { transform: numberAttribute });
    readonly step = input<number | number[] | string>(1);
    readonly splits = input<number[]>([]);
    readonly marks = input<number | number[] | string>();

    readonly change = output<RangeChange>();
    readonly input = output<number>();

    readonly segments = viewChildren(NgxSegmentDirective);
    readonly segmentRefs = viewChildren<NgxSegmentDirective, ElementRef<HTMLElement>>(NgxSegmentDirective, { read: ElementRef });
    readonly sliderRef = viewChild.required<ElementRef<HTMLElement>>('sliderRef');
    readonly thumbRefs = viewChildren<ElementRef<HTMLElement>>('thumbRef');

    protected _min = computed(() => minAttribute(this.min(), this.max()));
    protected _max = computed(() => maxAttribute(this.max(), this.min()));
    
    private _lower = computed(() => valueAttribute(this.type() === 'simple' ? this.min() : this.lower(), this._min(), this._max(), 0));
    private _upper = computed(() => valueAttribute(this.type() === 'simple' ? this.value() : this.upper(), this._min(), this._max(), 100));
    protected _origin = computed(() => valueAttribute(this.origin(), this._min(), this._max(), 0));
    private _steps = computed(() => stepAttribute(this.step(), this._min(), this._max()));
    protected _splits = computed(() => splitsAttribute(this.splits(), this._min(), this._max()));

    protected _marks = computed(() => marksAttribute(this.marks(), this._min(), this._max(), this._steps()));

    protected lowest = linkedSignal({
        source: () => ({ lower: this._lower(), steps: this._steps() }),
        computation: ({ lower, steps }) => closest(lower, steps)
    });
    protected highest = linkedSignal({
        source: () => ({ upper: this._upper(), steps: this._steps() }),
        computation: ({ upper, steps }) => closest(upper, steps)
    });

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
        const mapped = (this._max() - this._min()) * percentage / 100 + this._min();
        const rounded = closest(mapped, this._steps());
        if (thumb === this.thumbRefs()[0].nativeElement) this.lowest.set(rounded);
        if (thumb === this.thumbRefs()[1].nativeElement) this.highest.set(rounded);
        this.emitValue(rounded);
    }

    protected onClick(event: PointerEvent): void {
        event.stopPropagation();
        const slider = this.sliderRef().nativeElement;
        if (event.target !== slider) slider.dispatchEvent(new PointerEvent('pointerdown', event));
    }

    protected onSliding(event: PointerEvent): void {
        if (!event.isTrusted) event.stopPropagation();
        const range = this.element;
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
