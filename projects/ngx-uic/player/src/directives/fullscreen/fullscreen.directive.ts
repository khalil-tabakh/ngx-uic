import { DOCUMENT, Directive, ElementRef, afterRenderEffect, inject, input, signal } from '@angular/core';

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

    readonly keys = input(['Escape']);

    readonly fullscreen = signal(false);

    private toggle$ = afterRenderEffect({
        earlyRead: (onCleanup) => {
            const player = this.element.closest<HTMLElement>('ngx-player');
            const controller = new AbortController();
            player?.addEventListener('dblclick', () => this.fullscreen.set(!this.fullscreen()), { signal: controller.signal });
            player?.addEventListener('keyup', (event) => this.keys().includes(event.code) && this.fullscreen.set(false), { signal: controller.signal });
            onCleanup(() => controller.abort());
            return player;
        },
        mixedReadWrite: (player) => {
            this.fullscreen()
                ? !this.document.fullscreenElement && player()?.requestFullscreen()
                : this.document.fullscreenElement && this.document.exitFullscreen();
        }
    });
}
