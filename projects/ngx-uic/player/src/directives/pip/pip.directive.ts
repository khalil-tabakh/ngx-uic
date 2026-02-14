import { DOCUMENT, Directive, effect, inject, signal } from '@angular/core';
import { NgxPlayerComponent } from '../../components/player/player.component';

@Directive({
    selector: '[ngxPip]',
    host: {
        '(click)': '$event.stopPropagation(); pip.set(!pip())',
        '(dblclick)': '$event.stopPropagation()',
        '(document:enterpictureinpicture)': 'pip.set(true)',
        '(document:leavepictureinpicture)': 'pip.set(false)'
    },
    exportAs: 'ngxPip'
})
export class NgxPipDirective {
    private document = inject(DOCUMENT);
    private player = inject(NgxPlayerComponent);

    readonly pip = signal(false);

    private pip$ = effect(() => {
        if (this.pip()) this.player.video()?.requestPictureInPicture?.();
        else if (this.document.pictureInPictureElement) this.document.exitPictureInPicture();
    });
}
