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
        source: () => ({ audio: this.player.audio.value(), video: this.player.video.value() }),
        computation: ({ audio, video }) => video?.loop ?? audio?.loop ?? false
    });

    private loop$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.video.value() || this.player.audio.value();
        if (!media) return;
        const mutation$ = new MutationObserver(() => this.loop.set(media.loop));
        mutation$.observe(media, { attributeFilter: ['loop'] });
        onCleanup(() => mutation$.disconnect());
    });
    private toggle$ = effect(() => {
        const audio = this.player.audio.value();
        const video = this.player.video.value();
        if (audio) audio.loop = this.loop();
        if (video) video.loop = this.loop();
        if (!this.loop()) return;
        if (!!audio?.networkState && audio.ended) audio.play().catch(() => {});
        if (!!video?.networkState && video.ended) video.play().catch(() => {});
    });
}
