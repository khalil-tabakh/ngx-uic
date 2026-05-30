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

    readonly pip = signal(!!this.document.pictureInPictureElement);

    private toggle$ = effect(() => this.pip()
        ? !this.document.pictureInPictureElement && this.player.video()?.requestPictureInPicture?.()
        : this.document.pictureInPictureElement && this.document.exitPictureInPicture());
}
