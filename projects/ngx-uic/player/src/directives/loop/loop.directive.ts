import { Directive, effect, input, linkedSignal } from '@angular/core';

@Directive({
    selector: '[ngxLoop]',
    host: {
        '(click)': '$event.stopPropagation(); loop.set(!loop())',
        '(dblclick)': '$event.stopPropagation()'
    },
    exportAs: 'ngxLoop'
})
export class NgxLoopDirective {
    readonly audio = input<HTMLAudioElement>();
    readonly video = input<HTMLVideoElement>();

    readonly loop = linkedSignal({
        source: () => ({ audio: this.audio(), video: this.video() }),
        computation: ({ audio, video }) => video?.loop ?? audio?.loop ?? false
    });

    private loop$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.video() || this.audio();
        if (!media) return;
        const mutation$ = new MutationObserver(() => this.loop.set(media.loop));
        mutation$.observe(media, { attributeFilter: ['loop'] });
        onCleanup(() => mutation$.disconnect());
    });
    private toggle$ = effect(() => {
        if (this.audio()) this.audio()!.loop = this.loop();
        if (this.video()) this.video()!.loop = this.loop();
        const media: HTMLMediaElement | undefined = this.video() || this.audio();
        if (!media || !this.loop()) return;
        const audio = this.audio();
        const audioEnded = audio?.ended || audio?.currentTime === audio?.duration;
        if (audio?.currentSrc && audioEnded) audio.play().catch(() => {});
        const video = this.video();
        const videoEnded = video?.ended || video?.currentTime === video?.duration;
        if (video?.currentSrc && videoEnded) video.play().catch(() => {});
    });
}
