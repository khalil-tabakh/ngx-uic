import { Directive, effect, inject, linkedSignal } from '@angular/core';
import { NgxPlayerComponent } from '../../components/player/player.component';

@Directive({
    selector: '[ngxLoop]',
    host: {
        '(click)': '$event.stopPropagation(); loop.set(!loop())',
        '(dblclick)': '$event.stopPropagation()'
    },
    exportAs: 'ngxLoop'
})
export class NgxLoopDirective {
    private player = inject(NgxPlayerComponent);

    readonly loop = linkedSignal({
        source: () => ({ audio: this.player.audio(), video: this.player.video() }),
        computation: ({ audio, video }) => video?.loop ?? audio?.loop ?? false
    });

    private loop$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const mutation$ = new MutationObserver(() => this.loop.set(media.loop));
        mutation$.observe(media, { attributeFilter: ['loop'] });
        onCleanup(() => mutation$.disconnect());
    });
    private toggle$ = effect(() => {
        if (this.player.audio()) this.player.audio()!.loop = this.loop();
        if (this.player.video()) this.player.video()!.loop = this.loop();
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media || !this.loop()) return;
        const audio = this.player.audio();
        const audioEnded = audio?.ended || audio?.currentTime === audio?.duration;
        if (!!audio?.networkState && audioEnded) audio.play().catch(() => {});
        const video = this.player.video();
        const videoEnded = video?.ended || video?.currentTime === video?.duration;
        if (!!video?.networkState && videoEnded) video.play().catch(() => {});
    });
}
