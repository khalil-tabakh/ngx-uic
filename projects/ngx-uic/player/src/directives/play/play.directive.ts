import { Directive, Renderer2, effect, inject, linkedSignal } from '@angular/core';
import { NgxPlayerComponent } from '../../components/player/player.component';

@Directive({
    selector: '[ngxPlay]',
    host: { 
        '(click)': '$event.stopPropagation(); paused.set(!paused())',
        '(dblclick)': '$event.stopPropagation()'
    },
    exportAs: 'ngxPlay'
})
export class NgxPlayDirective {
    private player = inject(NgxPlayerComponent);
    private renderer = inject(Renderer2);

    readonly ended = linkedSignal({
        source: () => ({ audio: this.player.audio(), video: this.player.video() }),
        computation: ({ audio, video }) => video?.ended ?? audio?.ended ?? false
    });
    readonly paused = linkedSignal(() => this.player.isPaused());

    private ended$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const unlistenCanplay = this.renderer.listen(media, 'canplay', () => this.ended.set(false));
        const unlistenEnded = this.renderer.listen(media, 'ended', () => this.ended.set(true));
        onCleanup(() => {
            unlistenCanplay();
            unlistenEnded();
        });
    });
    private paused$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const unlistenPause = this.renderer.listen(media, 'pause', () => this.paused.set(!this.player.isLoading()));
        const unlistenPlaying = this.renderer.listen(media, 'play', () => this.paused.set(false));
        onCleanup(() => {
            unlistenPause();
            unlistenPlaying();
        });
    });
    private toggle$ = effect(() => {
        const isPaused = this.paused();
        if (this.player.isLoading()) return;
        const audio = this.player.audio();
        if (audio && audio.readyState !== audio.HAVE_NOTHING) isPaused ? audio.pause() : audio.play().catch(() => {});
        const video = this.player.video();
        if (video && video.readyState !== video.HAVE_NOTHING) isPaused ? video.pause() : video.play().catch(() => {});
    });
}
