import { Directive, Renderer2, effect, inject, input, linkedSignal } from '@angular/core';

@Directive({
    selector: '[ngxSpeed]',
    host: { 
        '(click)': '$event.stopPropagation()',
        '(dblclick)': '$event.stopPropagation()'
    },
    exportAs: 'ngxSpeed'
})
export class NgxSpeedDirective {
    private renderer = inject(Renderer2);

    readonly audio = input<HTMLAudioElement>();
    readonly video = input<HTMLVideoElement>();

    readonly speed = linkedSignal({
        source: () => ({ audio: this.audio(), video: this.video() }),
        computation: ({ audio, video }) => video?.playbackRate ?? audio?.playbackRate ?? 1
    });

    private adjust$ = effect(() => {
        if (this.audio()) this.audio()!.playbackRate = this.speed();
        if (this.video()) this.video()!.playbackRate = this.speed();
    });
    private speed$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.video() || this.audio();
        if (!media) return;
        const unlistenRatechange = this.renderer.listen(media, 'ratechange', () => this.speed.set(media.playbackRate));
        onCleanup(() => unlistenRatechange());
    });
}
