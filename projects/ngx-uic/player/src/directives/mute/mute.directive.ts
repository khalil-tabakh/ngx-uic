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
        computation: ({ audio, video }) => video?.muted ?? audio?.muted ?? false
    });

    private muted$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
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
        if (this.player.audio()) this.player.audio()!.muted = this.muted();
        if (this.player.video()) this.player.video()!.muted = this.muted();
    });
}
