import { Directive, Renderer2, effect, inject, input, linkedSignal } from '@angular/core';

@Directive({
    selector: '[ngxPlay]',
    host: { 
        '(click)': '$event.stopPropagation(); paused.set(!paused())',
        '(dblclick)': '$event.stopPropagation()'
    },
    exportAs: 'ngxPlay'
})
export class NgxPlayDirective {
    private renderer = inject(Renderer2);

    readonly audio = input<HTMLAudioElement>();
    readonly video = input<HTMLVideoElement>();

    readonly ended = linkedSignal({
        source: () => ({ audio: this.audio(), video: this.video() }),
        computation: ({ audio, video }) => video?.ended ?? audio?.ended ?? false
    });
    readonly paused = linkedSignal({
        source: () => ({ audio: this.audio(), video: this.video(), ended: this.ended() }),
        computation: ({ audio, video }) => video?.paused ?? audio?.paused ?? true
    });

    private ended$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.video() || this.audio();
        if (!media) return;
        const unlistenCanplay = this.renderer.listen(media, 'canplay', () => this.ended.set(false));
        const unlistenEnded = this.renderer.listen(media, 'ended', () => this.ended.set(true));
        onCleanup(() => {
            unlistenCanplay();
            unlistenEnded();
        });
    });
    private paused$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.video() || this.audio();
        if (!media) return;
        const unlistenPause = this.renderer.listen(media, 'pause', () => this.paused.set(true));
        const unlistenPlaying = this.renderer.listen(media, 'play', () => this.paused.set(false));
        onCleanup(() => {
            unlistenPause();
            unlistenPlaying();
        });
    });
    private toggle$ = effect(() => {
        const audio = this.audio();
        if (audio?.currentSrc) this.paused() ? audio.pause() : audio.play().catch(() => {});
        const video = this.video();
        if (video?.currentSrc) this.paused() ? video.pause() : video.play().catch(() => {});
    });
}
