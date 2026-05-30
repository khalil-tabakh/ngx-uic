import { DOCUMENT, Directive, ElementRef, afterRenderEffect, inject, signal } from '@angular/core';

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

    readonly fullscreen = signal(!!this.document.fullscreenElement);

    private toggle$ = afterRenderEffect({
        earlyRead: () => this.element.closest<HTMLElement>('ngx-player'),
        mixedReadWrite: (player) => {
            this.fullscreen()
                ? !this.document.fullscreenElement && player()?.requestFullscreen()
                : this.document.fullscreenElement && this.document.exitFullscreen();
        }
    });
}
