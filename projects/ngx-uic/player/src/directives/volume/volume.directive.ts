import { Directive, effect, inject, linkedSignal } from '@angular/core';
import { NgxPlayerComponent } from '../../components/player/player.component';

@Directive({
    selector: '[ngxVolume]',
    host: { 
        '(click)': '$event.stopPropagation()',
        '(dblclick)': '$event.stopPropagation()'
    },
    exportAs: 'ngxVolume'
})
export class NgxVolumeDirective {
    private player = inject(NgxPlayerComponent);

    readonly volume = linkedSignal({
        source: () => ({ audio: this.player.audio(), video: this.player.video() }),
        computation: ({ audio, video }) => video?.volume ?? audio?.volume ?? 1
    });

    private adjust$ = effect(() => {
        const audio = this.player.audio();
        if (audio) {
            audio.muted = !this.volume();
            if (!audio.muted) audio.volume = this.volume();
        }
        const video = this.player.video();
        if (video) {
            video.muted = !this.volume();
            if (!video.muted) video.volume = this.volume();
        }
    });
    private volume$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const onVolumechange = () => this.volume.set(media.muted ? 0 : media.volume);
        media.addEventListener('volumechange', onVolumechange);
        onCleanup(() => media.removeEventListener('volumechange', onVolumechange));
    });
}
