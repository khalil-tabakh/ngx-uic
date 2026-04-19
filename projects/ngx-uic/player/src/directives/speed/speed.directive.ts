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
        source: () => ({ audio: this.player.audio(), video: this.player.video() }),
        computation: ({ audio, video }) => video?.playbackRate ?? audio?.playbackRate ?? 1
    });

    private adjust$ = effect(() => {
        if (this.player.audio()) this.player.audio()!.playbackRate = this.speed();
        if (this.player.video()) this.player.video()!.playbackRate = this.speed();
    });
    private speed$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const onRatechange = () => this.speed.set(media.playbackRate);
        media.addEventListener('ratechange', onRatechange);
        onCleanup(() => media.removeEventListener('ratechange', onRatechange));
    });
}
