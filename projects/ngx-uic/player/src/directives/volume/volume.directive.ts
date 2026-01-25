import { Directive, Renderer2, effect, inject, input, linkedSignal } from '@angular/core';

@Directive({
    selector: '[ngxVolume]',
    host: { 
        '(click)': '$event.stopPropagation()',
        '(dblclick)': '$event.stopPropagation()'
    },
    exportAs: 'ngxVolume'
})
export class NgxVolumeDirective {
    private renderer = inject(Renderer2);

    readonly audio = input<HTMLAudioElement>();
    readonly video = input<HTMLVideoElement>();

    readonly volume = linkedSignal({
        source: () => ({ audio: this.audio(), video: this.video() }),
        computation: ({ audio, video }) => video?.volume ?? audio?.volume ?? 1
    });

    private adjust$ = effect(() => {
        if (this.audio()) {
            this.audio()!.muted = !this.volume();
            if (!this.audio()!.muted) this.audio()!.volume = this.volume();
        }
        if (this.video()) {
            this.video()!.muted = !this.volume();
            if (!this.video()!.muted) this.video()!.volume = this.volume();
        }
    });
    private volume$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.video() || this.audio();
        if (!media) return;
        const unlistenVolumechange = this.renderer.listen(media, 'volumechange', () => this.volume.set(media.muted ? 0 : media.volume));
        onCleanup(() => unlistenVolumechange());
    });
}
