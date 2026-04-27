import { Directive, effect, inject, linkedSignal } from '@angular/core';
import { NgxPlayerComponent } from '../../components/player/player.component';

@Directive({
    selector: '[ngxMute]',
    host: {
        '(click)': '$event.stopPropagation(); muted.set(!muted())',
        '(dblclick)': '$event.stopPropagation()'
    },
    exportAs: 'ngxMute'
})
export class NgxMuteDirective {
    private player = inject(NgxPlayerComponent);

    readonly muted = linkedSignal({
        source: () => ({ audio: this.player.audio(), video: this.player.video() }),
        computation: ({ audio, video }) => audio?.muted ?? video?.muted ?? false
    });

    private muted$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.audio() || this.player.video();
        if (!media) return;
        const mutation$ = new MutationObserver(() => this.muted.set(media.muted));
        mutation$.observe(media, { attributeFilter: ['muted'] });
        const onVolumechange = () => this.muted.set(media.muted);
        media.addEventListener('volumechange', onVolumechange);
        onCleanup(() => {
            mutation$.disconnect();
            media.removeEventListener('volumechange', onVolumechange);
        });
    });
    private toggle$ = effect(() => {
        const audio = this.player.audio();
        if (audio) audio.muted = this.muted();
        const video = this.player.video();
        if (video) video.muted = this.muted() || !!this.player.audioSource();
    });
}
