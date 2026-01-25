import { DOCUMENT, Directive, ElementRef, effect, inject, input, signal } from '@angular/core';

@Directive({
    selector: '[ngxFullscreen]',
    host: {
        '(click)': '$event.stopPropagation(); fullscreen.set(!fullscreen())',
        '(dblclick)': '$event.stopPropagation()',
        '(document:fullscreenchange)': 'fullscreen.set(!!document.fullscreenElement)'
    },
    exportAs: 'ngxFullscreen'
})
export class NgxFullscreenDirective {
    protected document = inject(DOCUMENT);
    private element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    readonly video = input.required<HTMLVideoElement>();
    readonly selector = input('ngx-player');

    readonly fullscreen = signal(false);

    private toggle$ = effect(() => {
        if (this.fullscreen()) this.element.closest(this.selector())?.requestFullscreen();
        else if (this.document.fullscreenElement) this.document.exitFullscreen();
    });
}
