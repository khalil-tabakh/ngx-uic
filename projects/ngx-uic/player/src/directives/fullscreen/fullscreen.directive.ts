import { DOCUMENT, Directive, effect, inject, signal } from '@angular/core';
import { NgxPlayerComponent } from '../../components/player/player.component';

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
    private player = inject(NgxPlayerComponent);

    readonly fullscreen = signal(!!this.document.fullscreenElement);

    private toggle$ = effect(() => this.fullscreen()
        ? !this.document.fullscreenElement && this.player.element.requestFullscreen()
        : this.document.fullscreenElement && this.document.exitFullscreen());
}
