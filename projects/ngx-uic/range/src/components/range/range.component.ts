import { ChangeDetectionStrategy, Component, ElementRef, ModelSignal, computed, inject, input, linkedSignal, model, numberAttribute, viewChild, viewChildren } from '@angular/core';
import { NgxSegmentDirective } from '../../directives/segment/segment.directive';
import { RangeType } from '../../models/range-type.model';
import { clamp, closest, distance } from '../../utils/functions.util';
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

    protected onSliding(event: PointerEvent): void {
        event.stopPropagation();
        const slider = this.sliderRef().nativeElement;
        if (slider !== event.target) {
            slider.dispatchEvent(new PointerEvent('pointerdown', event));
            return;
        }
        const thumbs = this.thumbRefs().map((thumbRef) => thumbRef.nativeElement);
        let oldModel: ModelSignal<number> | undefined = undefined;
        const controller = new AbortController();
        slider.setPointerCapture(event.pointerId);
        slider.addEventListener('pointermove', (event) => {
            const newModel = ((offsetX: number) => {
                if (this.type() === 'single') return this.value;
                else if (offsetX < thumbs[0].offsetLeft) return this.lower;
                else if (offsetX > thumbs[1].offsetLeft) return this.upper;
                else if (oldModel) return oldModel;
                else return distance(offsetX, thumbs[0].offsetLeft) < distance(offsetX, thumbs[1].offsetLeft) ? this.lower : this.upper;
            })(event.offsetX);
            const step = (this._max() - this._min()) * clamp(event.offsetX / slider.offsetWidth, 0, 1) + this._min();
            const newStep = closest(step, this._steps());
            newModel.set(newStep);
            oldModel = newModel;
            this.element.dispatchEvent(new Event('change'));
            this.element.dispatchEvent(new Event('input'));
        }, { signal: controller.signal });
        slider.addEventListener('pointerup', () => {
            controller.abort();
        }, { signal: controller.signal });
        slider.dispatchEvent(new PointerEvent('pointermove', event));
    }
}
