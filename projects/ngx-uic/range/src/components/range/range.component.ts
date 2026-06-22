import { Component, ElementRef, WritableSignal, computed, effect, inject, input, linkedSignal, model, numberAttribute, resource, signal, viewChild, viewChildren } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { between, clamp, closest, distance, percentage } from '../../utils/functions.util';
import { Value } from '../../utils/types.util';

@Component({
    selector: 'ngx-range',
    templateUrl: './range.component.html',
    styleUrl: './range.component.scss',
    host: { '(pointerdown)': 'onSliding($event)' }
})
export class NgxRangeComponent<T extends 'single' | 'double'> implements ControlValueAccessor {
    private element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private ngControl = inject(NgControl, { optional: true, self: true });

    readonly mark = input<readonly number[] | number | string>([]);
    readonly max = input(100, { transform: numberAttribute });
    readonly min = input(0, { transform: numberAttribute });
    readonly relative = input(undefined, { transform: numberAttribute });
    readonly split = input<readonly number[] | number | string>([]);
    readonly step = input<readonly number[] | number | string>(1);
    readonly stride = input(1, { transform: numberAttribute });
    readonly type = input('single' as T, {
        transform: (value: T) => {
            this.value.set((value === 'double' ? [25, 75] : 50) as ReturnType<typeof this.value>);
            return value;
        }
    });

    readonly disabled = model(false);
    readonly value = model(50 as Value<T>);

    readonly segmentRefs = viewChildren<ElementRef<HTMLElement>>('segmentRef');
    readonly sliderRef = viewChild.required<ElementRef<HTMLElement>>('sliderRef');
    readonly thumbRefs = viewChildren<ElementRef<HTMLElement>>('thumbRef');
    readonly trackRef = viewChild.required<ElementRef<HTMLElement>>('trackRef');

    protected lower = linkedSignal({
        source: this.type,
        computation: (type) => type === 'double' ? (this.value() as [number, number])[0] : NaN
    });
    protected upper = linkedSignal({
        source: this.type,
        computation: (type) => type === 'double' ? (this.value() as [number, number])[1] : +this.value()
    });

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

    private applyStyles$ = effect(() => {
        const hover = this.hover.value();
        const lower = this.type() === 'single' ? this.origin() : this.lower();
        const upper = this.type() === 'single' ? +this.value() : this.upper();
        const value = this.type() === 'single' ? +this.value() : distance(hover, lower) < distance(hover, upper) ? lower : upper;
        this.segments().entries().forEach(([start, end], index) => {
            const segment = this.segmentRefs()[index].nativeElement;
            segment.classList.toggle('segment--hover', between(hover, start, end));
            segment.classList.toggle('segment--lower', between(this.lower(), start, end));
            segment.classList.toggle('segment--upper', between(this.upper(), start, end));
            segment.classList.toggle('segment--value', between(+this.value(), start, end));
            segment.style.setProperty('--hover', `${clamp(percentage(hover, start, end), 0, 100)}`);
            segment.style.setProperty('--lower', `${clamp(percentage(lower, start, end), 0, 100)}`);
            segment.style.setProperty('--upper', `${clamp(percentage(upper, start, end), 0, 100)}`);
            segment.style.setProperty('--value', `${clamp(percentage(value, start, end), 0, 100)}`);
        });
    });
    private updateValue$ = effect(() => {
        const min = this.min(), max = this.max(), steps = this.steps(), origin = this.origin(), type = this.type();
        this.value.update((value) => {
            if (type === 'single') {
                let progress = value as number;
                if (!between(progress, min, max)) progress = origin;
                else if (!steps.includes(progress)) progress = closest(progress, steps);
                return progress as ReturnType<typeof this.value>;
            } else {
                let [lower, upper] = value as [number, number];
                if (!between(lower, min, max)) lower = min;
                else if (!steps.includes(lower)) lower = closest(lower, steps);
                if (!between(upper, min, max)) upper = max;
                else if (!steps.includes(upper)) upper = closest(upper, steps);
                return [lower, upper] as ReturnType<typeof this.value>;
            }
        });
    });

    constructor() {
        if (this.ngControl && !this.ngControl.control) this.ngControl.valueAccessor = this;
    }

    protected onSliding(event: PointerEvent): void {
        const slider = this.sliderRef().nativeElement;
        if (slider !== event.target) {
            slider.dispatchEvent(new PointerEvent('pointerdown', event));
            return;
        } else event.stopPropagation(); // Prevent infinite event propagation loop
        const thumbs = this.thumbRefs().map((thumbRef) => thumbRef.nativeElement);
        const oldLower = this.lower(), oldUpper = this.upper();
        let oldSignal: WritableSignal<number> | undefined = undefined;
        const controller = new AbortController();
        slider.setPointerCapture(event.pointerId);
        slider.addEventListener('pointermove', (event) => {
            const newSignal = ((offsetX: number) => {
                if (this.type() === 'single') return this.upper;
                else if (offsetX < thumbs[0].offsetLeft) return this.lower;
                else if (offsetX > thumbs[1].offsetLeft) return this.upper;
                else if (oldSignal) return oldSignal;
                else return distance(offsetX, thumbs[0].offsetLeft) < distance(offsetX, thumbs[1].offsetLeft) ? this.lower : this.upper;
            })(event.offsetX);
            const oldValue = newSignal();
            const step = (this.max() - this.min()) * clamp(event.offsetX / slider.offsetWidth, 0, 1) + this.min();
            const newValue = closest(step, this.steps());
            newSignal.set(newValue);
            oldSignal = newSignal;
            if (newValue !== oldValue) {
                this.value.set((this.type() === 'double' ? [this.lower(), this.upper()] : this.upper()) as ReturnType<typeof this.value>);
                this.onChange(this.value());
                this.element.dispatchEvent(new Event('input'));
            }
        }, { signal: controller.signal });
        slider.addEventListener('pointerup', () => {
            const newLower = this.lower(), newUpper = this.upper();
            if ((this.type() === 'single' && newLower !== oldLower) || newUpper !== oldUpper) this.element.dispatchEvent(new Event('change'));
            controller.abort();
            this.onTouched();
        }, { signal: controller.signal });
        slider.dispatchEvent(new PointerEvent('pointermove', event));
    }

    protected onUpdate(event: KeyboardEvent, signal: WritableSignal<number>): void {
        const thumb = event.target as HTMLElement;
        const thumbs = this.thumbRefs().map((thumbRef) => thumbRef.nativeElement);
        const steps = this.steps();
        const stride = steps.length ? Math.round(this.stride()) : this.stride();
        const index = steps.indexOf(signal());
        const oldValue = signal();
        switch (event.code) {
            case 'ArrowDown':
            case 'ArrowLeft':
                event.preventDefault();
                const previous = steps[index - stride] ?? steps.at(0) ?? Math.max(this.min(), stride);
                if (this.type() === 'double' && thumb !== thumbs[0] && previous < this.lower()) {
                    thumbs[0].focus();
                    thumbs[0].dispatchEvent(new KeyboardEvent('keydown', event));
                } else {
                    signal.set(previous);
                    this.onTouched();
                }
                break;
            case 'ArrowRight':
            case 'ArrowUp':
                event.preventDefault();
                const next = steps[index + stride] ?? steps.at(-1) ?? Math.min(this.max(), stride);
                if (this.type() === 'double' && thumb !== thumbs[1] && next > this.upper()) {
                    thumbs[1].focus();
                    thumbs[1].dispatchEvent(new KeyboardEvent('keydown', event));
                } else {
                    signal.set(next);
                    this.onTouched();
                }
                break;
            case 'End':
                event.preventDefault();
                signal.set(+thumb.ariaValueMax!);
                this.onTouched();
                break;
            case 'Home':
                event.preventDefault();
                signal.set(+thumb.ariaValueMin!);
                this.onTouched();
                break;
        }
        const newValue = signal();
        if (oldValue !== newValue) {
            this.value.set((this.type() === 'double' ? [this.lower(), this.upper()] : this.upper()) as ReturnType<typeof this.value>);
            this.onChange(this.value());
            this.element.dispatchEvent(new Event('input'));
            this.element.dispatchEvent(new Event('change'));
        }
    }

    /* ControlValueAccessor */

    onChange = (_: ReturnType<typeof this.value>): void => {};

    onTouched = (): void => {};

    registerOnChange(fn: typeof this.onChange): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: typeof this.onTouched): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }

    writeValue(value: ReturnType<typeof this.value>): void {
        this.value.set(value);
    }

    /* FormValueControl */

    focus(options?: FocusOptions): void {
        this.thumbRefs().at(0)?.nativeElement.focus(options);
    }
}
