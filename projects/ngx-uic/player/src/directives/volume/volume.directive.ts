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
        source: () => ({ audio: this.player.audio.value(), video: this.player.video.value() }),
        computation: ({ audio, video }) => audio?.volume ?? video?.volume ?? 1
    });

    private adjust$ = effect(() => {
        const audio = this.player.audio.value();
        if (audio) {
            audio.muted = !this.volume();
            if (!audio.muted) audio.volume = this.volume();
        }
        const video = this.player.video.value();
        if (video) {
            video.muted = !this.volume() || !!this.player.audioSource();
            if (!video.muted) video.volume = this.volume();
        }
    });
    private volume$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.audio.value() || this.player.video.value();
        const controller = new AbortController();
        media?.addEventListener('volumechange', () => this.volume.set(media.muted ? 0 : media.volume), { signal: controller.signal });
        onCleanup(() => controller.abort());
    });
}
