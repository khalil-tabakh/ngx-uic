import { Directive, effect, inject, linkedSignal } from '@angular/core';
import { NgxPlayerComponent } from '../../components/player/player.component';

@Directive({
    selector: '[ngxSpeed]',
    host: { 
        '(click)': '$event.stopPropagation()',
        '(dblclick)': '$event.stopPropagation()'
    },
    exportAs: 'ngxSpeed'
})
export class NgxSpeedDirective {
    private player = inject(NgxPlayerComponent);

    readonly speed = linkedSignal({
        source: () => ({ audio: this.player.audio.value(), video: this.player.video.value() }),
        computation: ({ audio, video }) => video?.playbackRate ?? audio?.playbackRate ?? 1
    });

    private adjust$ = effect(() => {
        if (this.player.audio.value()) this.player.audio.value()!.playbackRate = this.speed();
        if (this.player.video.value()) this.player.video.value()!.playbackRate = this.speed();
    });
    private speed$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.video.value() || this.player.audio.value();
        const controller = new AbortController();
        media?.addEventListener('ratechange', () => this.speed.set(media.playbackRate), { signal: controller.signal });
        onCleanup(() => controller.abort());
    });
}
