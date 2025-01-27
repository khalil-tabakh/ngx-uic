// Angular
import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Renderer2, computed, effect, inject, input, model, output } from '@angular/core';
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
    readonly min = input(0);
    readonly step = input(1);
    readonly max = input(100);

    readonly change = output<RangeChange>();
    readonly input = output<number>();
    
    readonly lower = model(this.min());
    readonly value = model(this.min());
    readonly upper = model(this.max());

    private low = computed(() => (this.lower() - this.min()) / (this.max() - this.min()) * 100);
    private progress = computed(() => (this.value() - this.min()) / (this.max() - this.min()) * 100);
    private high = computed(() => (this.upper() - this.min()) / (this.max() - this.min()) * 100);

    private setStyle$ = effect(() => {
        if (this.type() === 'simple') {
            this.elementRef.nativeElement.style.removeProperty('--low');
            this.elementRef.nativeElement.style.removeProperty('--high');
            this.elementRef.nativeElement.style.setProperty('--progress', String(this.progress()));
        } else {
            this.elementRef.nativeElement.style.removeProperty('--progress');
            this.elementRef.nativeElement.style.setProperty('--low', String(this.low()));
            this.elementRef.nativeElement.style.setProperty('--high', String(this.high()));
        }
    });

    private setValue(percentage: number, thumb?: '::before' | '::after'): void {
        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;
        const mapped = (this.max() - this.min()) * percentage / 100 + this.min();
        const rounded = this.step() ? Math.round(mapped / this.step()) * this.step() : mapped;
        if (thumb === '::before') this.lower.set(rounded);

        if (thumb === undefined) this.value.set(rounded);
        if (thumb === '::after') this.upper.set(rounded);
        this.change.emit(this.type() === 'simple' ? { 
            value: this.value(),
        } : {
            lower: this.lower(),
            upper: this.upper()
        });
        this.input.emit(rounded);
    }

    @HostListener('pointerdown', ['$event'])
    private onSliding(event: PointerEvent): void {
        const slider = this.elementRef.nativeElement.children.item(1)!;
        const sliderStyle = getComputedStyle(slider);
        const sliderWidth = parseFloat(sliderStyle.width);
        
        const thumb1Style = getComputedStyle(slider, '::before');
        const thumb2Style = getComputedStyle(slider, '::after');
        const closestThumb = (offsetX: number) => {
            if (this.type() === 'simple') return;
            const thumb1X = parseFloat(thumb1Style.left);
            const thumb2X = parseFloat(thumb2Style.left);
            return Math.abs(offsetX - thumb1X) < Math.abs(offsetX - thumb2X) ? '::before' : '::after';
        }
        const thumb = closestThumb(event.offsetX);
        const percentage = event.offsetX / sliderWidth * 100;
        this.setValue(percentage, thumb);

        slider.setPointerCapture(event.pointerId);
        const onPointerMove = this.renderer.listen(slider, 'pointermove', (event: PointerEvent) => {
            const thumb = closestThumb(event.offsetX);
            const percentage = event.offsetX / sliderWidth * 100;
            this.setValue(percentage, thumb);
        });
        const onPointerUp = this.renderer.listen(slider, 'pointerup', () => {
            onPointerMove();
            onPointerUp();
        });
    }
}
