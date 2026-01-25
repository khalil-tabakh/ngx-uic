import { Directive, Renderer2, effect, inject, input, linkedSignal } from '@angular/core';

@Directive({
    selector: '[ngxMute]',
    host: {
        '(click)': '$event.stopPropagation(); muted.set(!muted())',
        '(dblclick)': '$event.stopPropagation()'
    },
    exportAs: 'ngxMute'
})
export class NgxMuteDirective {
    private renderer = inject(Renderer2);

    readonly audio = input<HTMLAudioElement>();
    readonly video = input<HTMLVideoElement>();

    readonly muted = linkedSignal({
        source: () => ({ audio: this.audio(), video: this.video() }),
        computation: ({ audio, video }) => video?.muted ?? audio?.muted ?? false
    });

    private muted$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.video() || this.audio();
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
        if (this.audio()) this.audio()!.muted = this.muted();
        if (this.video()) this.video()!.muted = this.muted();
    });
}
