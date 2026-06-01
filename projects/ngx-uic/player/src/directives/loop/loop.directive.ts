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
        const audio = this.player.audio();
        const video = this.player.video();
        if (audio) audio.loop = this.loop();
        if (video) video.loop = this.loop();
        if (!this.loop()) return;
        if (!!audio?.networkState && audio.ended) audio.play().catch(() => {});
        if (!!video?.networkState && video.ended) video.play().catch(() => {});
    });
}
