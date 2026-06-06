import { Component, ElementRef, ModelSignal, computed, effect, inject, input, model, numberAttribute, resource, signal, untracked, viewChild, viewChildren } from '@angular/core';
import { between, clamp, closest, distance, percentage } from '../../utils/functions.util';

@Component({
    selector: 'ngx-range',
    templateUrl: './range.component.html',
    styleUrl: './range.component.scss',
    host: { '(pointerdown)': 'onSliding($event)' }
})
export class NgxRangeComponent {
    private element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    readonly type = input<'single' | 'double'>('single');
    readonly min = input(0, { transform: numberAttribute });
    readonly max = input(100, { transform: numberAttribute });
    readonly step = input<readonly number[] | number | string>(1);
    readonly mark = input<readonly number[] | number | string>([]);
    readonly split = input<readonly number[] | number | string>([]);
    readonly relative = input(undefined, { transform: numberAttribute });

    readonly lower = model(25);
    readonly value = model(50);
    readonly upper = model(75);

    readonly segmentRefs = viewChildren<ElementRef<HTMLElement>>('segmentRef');
    readonly sliderRef = viewChild.required<ElementRef<HTMLElement>>('sliderRef');
    readonly thumbRefs = viewChildren<ElementRef<HTMLElement>>('thumbRef');
    readonly trackRef = viewChild.required<ElementRef<HTMLElement>>('trackRef');

    readonly marks = computed<readonly number[]>(() => {
        const min = this.min(), max = this.max(), mark = this.mark();
        if (min >= max) return [];
        return Array.isArray(mark)
            ? new Set(mark).values().toArray().toSorted((a, b) => a - b).filter((mark) => between(mark, min, max))
            : new Array(+mark ? Math.floor((max - min) / +mark) + 1 : 0).fill(0).map((_, index) => +mark * index + min);
    });
    readonly splits = computed<readonly number[]>(() => {
        const min = this.min(), max = this.max(), split = this.split();
        if (min >= max) return [];
        return Array.isArray(split)
            ? new Set(split).values().toArray().toSorted((a, b) => a - b).filter((split) => between(split, min, max))
            : new Array(+split ? Math.floor((max - min) / +split) + 1 : 0).fill(0).map((_, index) => +split * index + min);
    });
    readonly steps = computed<readonly number[]>(() => {
        const min = this.min(), max = this.max(), step = this.step();
        if (min >= max) return [min];
        return Array.isArray(step)
            ? new Set(step).values().toArray().toSorted((a, b) => a - b).filter((step) => between(step, min, max))
            : new Array(+step ? Math.floor((max - min) / +step) + 1 : 0).fill(0).map((_, index) => +step * index + min);
    });

    readonly origin = computed(() => {
        const min = this.min(), max = this.max(), steps = this.steps(), relative = this.relative();
        if (relative === undefined || !between(relative, min, max)) return min;
        else if (!steps.includes(relative)) return closest(relative, steps);
        else return relative;
    });
    readonly segments = computed(() => {
        const min = this.min(), max = this.max(), splits = this.splits(), segmentRefs = this.segmentRefs(), trackRef = this.trackRef();
        return segmentRefs.reduce((segments, segmentRef) => {
            const segmentOffsetLeft = segmentRef.nativeElement.offsetLeft;
            const segmentOffsetRight = segmentRef.nativeElement.offsetLeft + segmentRef.nativeElement.offsetWidth;
            const start = (max - min) * segmentOffsetLeft / trackRef.nativeElement.offsetWidth + min;
            const end = (max - min) * segmentOffsetRight / trackRef.nativeElement.offsetWidth + min;
            return segments.set(start, end);
        }, new Map<number, number>()) as ReadonlyMap<number, number>;
    });

    readonly hover = resource({
        defaultValue: NaN,
        params: () => ({ min: this.min(), max: this.max(), range: this.element }),
        stream: ({ abortSignal, params }) => {
            const { min, max, range } = params;
            const response = signal({ value: NaN });
            range.addEventListener('pointerenter', () => {
                const rangeStyle = getComputedStyle(range);
                const rangeRect = range.getBoundingClientRect();
                const rangeLeft = rangeRect.left + parseFloat(rangeStyle.paddingLeft);
                const rangeRight = rangeRect.right - parseFloat(rangeStyle.paddingRight);
                const rangeWidth = rangeRight - rangeLeft;
                const controller = new AbortController();
                range.addEventListener('pointermove', (event) => {
                    const offsetX = event.clientX - rangeLeft;
                    response.set({ value: (max - min) * clamp(offsetX / rangeWidth, 0, 1) + min });
                }, { signal: controller.signal });
                range.addEventListener('pointerleave', () => {
                    response.set({ value: NaN });
                    controller.abort();
                }, { signal: controller.signal });
            }, { signal: abortSignal });
            return response;
        }
    }).asReadonly();

    private initModels$ = effect(() => {
        const min = this.min(), max = this.max(), steps = this.steps(), origin = this.origin(), type = this.type();
        untracked(() => {
            if (type === 'single') this.lower.set(NaN);
            else if (!between(this.lower(), min, max)) this.lower.set(min);
            else if (!steps.includes(this.lower())) this.lower.update((lower) => closest(lower, steps));
            if (type === 'double') this.value.set(NaN);
            else if (!between(this.value(), min, max)) this.value.set(origin);
            else if (!steps.includes(this.value())) this.value.update((value) => closest(value, steps));
            if (type === 'single') this.upper.set(NaN);
            else if (!between(this.upper(), min, max)) this.upper.set(max);
            else if (!steps.includes(this.upper())) this.upper.update((upper) => closest(upper, steps));
        });
    });
    private updateStyles$ = effect(() => {
        const hover = this.hover.value();
        const lower = this.type() === 'single' ? this.origin() : this.lower();
        const upper = this.type() === 'single' ? this.value() : this.upper();
        const value = this.type() === 'single' ? this.value() : distance(hover, lower) < distance(hover, upper) ? lower : upper;
        this.segments().entries().forEach(([start, end], index) => {
            const segment = this.segmentRefs()[index].nativeElement;
            segment.classList.toggle('segment--hover', between(hover, start, end));
            segment.classList.toggle('segment--lower', between(this.lower(), start, end));
            segment.classList.toggle('segment--upper', between(this.upper(), start, end));
            segment.classList.toggle('segment--value', between(this.value(), start, end));
            segment.style.setProperty('--hover', `${clamp(percentage(hover, start, end), 0, 100)}`);
            segment.style.setProperty('--lower', `${clamp(percentage(lower, start, end), 0, 100)}`);
            segment.style.setProperty('--upper', `${clamp(percentage(upper, start, end), 0, 100)}`);
            segment.style.setProperty('--value', `${clamp(percentage(value, start, end), 0, 100)}`);
        });
    });

    protected onSliding(event: PointerEvent): void {
        const slider = this.sliderRef().nativeElement;
        if (slider !== event.target) {
            slider.dispatchEvent(new PointerEvent('pointerdown', event));
            return;
        } else event.stopPropagation(); // Prevent infinite event propagation loop
        const thumbs = this.thumbRefs().map((thumbRef) => thumbRef.nativeElement);
        const oldLower = this.lower(), oldValue = this.value(), oldUpper = this.upper();
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
            const oldStep = newModel();
            const step = (this.max() - this.min()) * clamp(event.offsetX / slider.offsetWidth, 0, 1) + this.min();
            const newStep = closest(step, this.steps());
            newModel.set(newStep);
            oldModel = newModel;
            if (newStep !== oldStep) this.element.dispatchEvent(new Event('input'));
        }, { signal: controller.signal });
        slider.addEventListener('pointerup', () => {
            const newLower = this.lower(), newValue = this.value(), newUpper = this.upper();
            if (newLower !== oldLower || newValue !== oldValue || newUpper !== oldUpper) this.element.dispatchEvent(new Event('change'));
            controller.abort();
        }, { signal: controller.signal });
        slider.dispatchEvent(new PointerEvent('pointermove', event));
    }
}
