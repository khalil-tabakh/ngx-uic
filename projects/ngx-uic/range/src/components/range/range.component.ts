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

    private setValue(percentage: number, thumb: '::before' | '::after'): void {
        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;
        const mapped = (this.max() - this.min()) * percentage / 100 + this.min();
        const rounded = this.step() ? Math.round(mapped / this.step()) * this.step() : mapped;
        if (thumb === '::before') this.lowest.set(rounded);
        if (thumb === '::after') this.highest.set(rounded);

        const event: RangeChange = this.type() === 'simple'
            ? { value: this.highest() }
            : { lower: this.lowest(), upper: this.highest() };
        this.change.emit(event);
        this.input.emit(rounded);
    }

    @HostListener('pointerdown', ['$event'])
    private onSliding(event: PointerEvent): void {
        const slider = this.elementRef.nativeElement.children.item(1)!;
        const sliderStyle = getComputedStyle(slider);
        const sliderWidth = parseFloat(sliderStyle.width);
        
        const thumb1Style = getComputedStyle(slider, '::before');
        const thumb2Style = getComputedStyle(slider, '::after');
        let thumb: '::before' | '::after' = '::after';
        if (this.type() === 'double') {
            const thumb1X = parseFloat(thumb1Style.left);
            const thumb2X = parseFloat(thumb2Style.left);
            thumb = Math.abs(event.offsetX - thumb1X) < Math.abs(event.offsetX - thumb2X) ? '::before' : '::after';
        };
        const percentage = event.offsetX / sliderWidth * 100;
        this.setValue(percentage, thumb);

        slider.setPointerCapture(event.pointerId);
        const onPointerMove = this.renderer.listen(slider, 'pointermove', (event: PointerEvent) => {
            if (event.offsetX < parseFloat(thumb1Style.left)) thumb = '::before';
            if (event.offsetX > parseFloat(thumb2Style.left)) thumb = '::after';
            const percentage = event.offsetX / sliderWidth * 100;
            this.setValue(percentage, thumb);
        });
        const onPointerUp = this.renderer.listen(slider, 'pointerup', () => {
            onPointerMove();
            onPointerUp();
        });
    }
}
