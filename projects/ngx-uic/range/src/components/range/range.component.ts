import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, linkedSignal, model, numberAttribute, viewChild, viewChildren } from '@angular/core';
import { NgxSegmentDirective } from '../../directives/segment/segment.directive';
import { RangeType } from '../../models/range-type.model';
import { closest } from '../../utils/functions.util';
import { marksAttribute, maxAttribute, minAttribute, splitsAttribute, stepAttribute, valueAttribute } from '../../utils/transforms.util';

@Component({
    selector: 'ngx-range',
    imports: [NgxSegmentDirective],
    templateUrl: './range.component.html',
    styleUrl: './range.component.scss',
    host: { '(pointerdown)': 'onSliding($event)' },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxRangeComponent {
    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement

    readonly type = input<RangeType>('single');
    readonly min = input(0, { transform: numberAttribute });
    readonly max = input(100, { transform: numberAttribute });
    readonly origin = input(0, { transform: numberAttribute });
    readonly offset = input(1, { transform: numberAttribute });
    readonly step = input<number | number[] | string>(1);
    readonly splits = input<number[]>([]);
    readonly marks = input<number | number[] | string>();

    readonly lower = model(25);
    readonly value = model(50);
    readonly upper = model(75);

    readonly segments = viewChildren(NgxSegmentDirective);
    readonly segmentRefs = viewChildren<NgxSegmentDirective, ElementRef<HTMLElement>>(NgxSegmentDirective, { read: ElementRef });
    readonly sliderRef = viewChild.required<ElementRef<HTMLElement>>('sliderRef');
    readonly thumbRefs = viewChildren<ElementRef<HTMLElement>>('thumbRef');

    protected _min = computed(() => minAttribute(this.min(), this.max()));
    protected _max = computed(() => maxAttribute(this.max(), this.min()));
    
    private _lower = computed(() => valueAttribute(this.type() === 'single' ? this.min() : this.lower(), this._min(), this._max(), 0));
    private _upper = computed(() => valueAttribute(this.type() === 'single' ? this.value() : this.upper(), this._min(), this._max(), 100));
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

    private setValue(offsetX: number, thumb: HTMLElement): void {
        let percentage = offsetX / this.sliderRef().nativeElement.offsetWidth * 100;
        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;
        const mapped = (this._max() - this._min()) * percentage / 100 + this._min();
        const rounded = closest(mapped, this._steps());
        if (this.type() === 'single') this.value.set(rounded);
        else if (thumb === this.thumbRefs()[0].nativeElement) this.lower.set(rounded);
        else if (thumb === this.thumbRefs()[1].nativeElement) this.upper.set(rounded);
        this.element.dispatchEvent(new Event('change'));
        this.element.dispatchEvent(new Event('input'));
    }

    protected onSliding(event: PointerEvent): void {
        event.stopPropagation();
        const slider = this.sliderRef().nativeElement;
        if (slider !== event.target) {
            slider.dispatchEvent(new PointerEvent('pointerdown', event));
            return;
        }
        const thumbs = this.thumbRefs().map((thumbRef) => thumbRef.nativeElement);
        const thumbDistance = (thumb: HTMLElement) => Math.abs(event.offsetX - thumb.offsetLeft);
        let thumb = thumbDistance(thumbs[0]) < thumbDistance(thumbs[1]) ? thumbs[0] : thumbs[1];
        if (event.target === thumbs[0]) thumb = thumbs[0];
        if (event.target === thumbs[1] || this.type() === 'single') thumb = thumbs[1];
        if (event.target === slider) this.setValue(event.offsetX, thumb);

        const controller = new AbortController();
        slider.setPointerCapture(event.pointerId);
        slider.addEventListener('pointermove', (event) => {
            if (event.offsetX < thumbs[0].offsetLeft) thumb = thumbs[0];
            if (event.offsetX > thumbs[1].offsetLeft || this.type() === 'single') thumb = thumbs[1];
            this.setValue(event.offsetX, thumb);
        }, { signal: controller.signal });
        slider.addEventListener('pointerup', () => {
            controller.abort();
        }, { signal: controller.signal });
    }
}
