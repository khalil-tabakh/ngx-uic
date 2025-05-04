// Angular
import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Renderer2, computed, effect, inject, input, linkedSignal, output } from '@angular/core';
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
    private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    private renderer = inject(Renderer2);

    readonly type = input<RangeType>('simple');
    readonly min = input(0, { transform: (value: number | string) => isNaN(Number(value)) ? 0 : Number(value) });
    readonly lower = input(25, { transform: (value: number | string) => isNaN(Number(value)) ? 25 : Number(value) });
    readonly value = input(50, { transform: (value: number | string) => isNaN(Number(value)) ? 50 : Number(value) });
    readonly upper = input(75, { transform: (value: number | string) => isNaN(Number(value)) ? 75 : Number(value) });
    readonly max = input(100, { transform: (value: number | string) => isNaN(Number(value)) ? 100 : Number(value) });
    readonly step = input(1, { transform: (value: number | string) => isNaN(Number(value)) ? 1 : Number(value) });

    readonly change = output<RangeChange>();
    readonly input = output<number>();

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

    private low = computed(() => (this.lowest() - this.min()) / (this.max() - this.min()) * 100);
    private high = computed(() => (this.highest() - this.min()) / (this.max() - this.min()) * 100);

    private setStyle$ = effect(() => {
        if (this.type() === 'simple') {
            this.elementRef.nativeElement.style.removeProperty('--low');
            this.elementRef.nativeElement.style.setProperty('--high', String(this.high()));
        } else {
            this.elementRef.nativeElement.style.setProperty('--low', String(this.low()));
            this.elementRef.nativeElement.style.setProperty('--high', String(this.high()));
        }
    });

    private setValue(percentage: number, thumb: string): void {
        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;
        const mapped = (this.max() - this.min()) * percentage / 100 + this.min();
        const rounded = this.step() ? Math.round(mapped / this.step()) * this.step() : mapped;
        if (thumb === 'first') this.lowest.set(rounded);
        if (thumb === 'last') this.highest.set(rounded);

        const event: RangeChange = this.type() === 'simple'
            ? { value: this.highest() }
            : { lower: this.lowest(), upper: this.highest() };
        this.change.emit(event);
        this.input.emit(rounded);
    }

    @HostListener('pointerdown', ['$event'])
    private onSliding(event: PointerEvent): void {
        const range = this.elementRef.nativeElement;
        const track = range.getElementsByClassName('track')[0];
        const slider = range.getElementsByClassName('slider')[0] as HTMLElement;
        const thumbs = slider.getElementsByClassName('thumb') as HTMLCollectionOf<HTMLElement>;

        let thumb = Math.abs(event.offsetX - thumbs[0].offsetLeft) < Math.abs(event.offsetX - thumbs[1].offsetLeft) ? 'first' : 'last';
        if (event.target === thumbs[0]) thumb = 'first';
        if (event.target === thumbs[1] || this.type() === 'simple') thumb = 'last';
        if (event.target === slider || event.target === track) {
            const percentage = event.offsetX / slider.scrollWidth * 100;
            this.setValue(percentage, thumb);
        }

        slider.setPointerCapture(event.pointerId);
        const onPointerMove = this.renderer.listen(slider, 'pointermove', (event: PointerEvent) => {
            if (event.offsetX < thumbs[0].offsetLeft) thumb = 'first';
            if (event.offsetX > thumbs[1].offsetLeft) thumb = 'last';
            const percentage = event.offsetX / slider.scrollWidth * 100;
            this.setValue(percentage, thumb);
        });
        const onPointerUp = this.renderer.listen(slider, 'pointerup', () => {
            onPointerUp();
            onPointerMove();
        });
    }
}
