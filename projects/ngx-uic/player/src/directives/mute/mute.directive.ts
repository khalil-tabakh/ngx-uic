import { Directive, Renderer2, effect, inject, linkedSignal } from '@angular/core';
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
    private renderer = inject(Renderer2);

    readonly muted = linkedSignal({
        source: () => ({ audio: this.player.audio(), video: this.player.video() }),
        computation: ({ audio, video }) => video?.muted ?? audio?.muted ?? false
    });

    private muted$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const mutation$ = new MutationObserver(() => this.muted.set(media.muted));
        mutation$.observe(media, { attributeFilter: ['muted'] });
        const unlistenVolumechange = this.renderer.listen(media, 'volumechange', () => this.muted.set(media.muted));
        onCleanup(() => {
            mutation$.disconnect();
            unlistenVolumechange();
        });
    });
    private toggle$ = effect(() => {
        if (this.player.audio()) this.player.audio()!.muted = this.muted();
        if (this.player.video()) this.player.video()!.muted = this.muted();
    });
}
