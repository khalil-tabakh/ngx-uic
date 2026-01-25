import { DOCUMENT, Directive, effect, inject, input, signal } from '@angular/core';

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

    readonly video = input.required<HTMLVideoElement>();

    readonly pip = signal(false);

    private pip$ = effect(() => {
        if (this.pip()) this.video().requestPictureInPicture?.();
        else if (this.document.pictureInPictureElement) this.document.exitPictureInPicture();
    });
}
