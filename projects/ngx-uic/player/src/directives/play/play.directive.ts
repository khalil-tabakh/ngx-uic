import { Directive, effect, inject, linkedSignal } from '@angular/core';
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

    readonly ended = linkedSignal({
        source: () => ({ audio: this.player.audio(), video: this.player.video() }),
        computation: ({ audio, video }) => video?.ended ?? audio?.ended ?? false
    });
    readonly paused = linkedSignal(() => this.player.isPaused());

    private ended$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const onCanplay = () => this.ended.set(false);
        media.addEventListener('canplay', onCanplay);
        const onEnded = () => this.ended.set(true);
        media.addEventListener('ended', onEnded);
        onCleanup(() => {
            media.removeEventListener('canplay', onCanplay);
            media.removeEventListener('ended', onEnded);
        });
    });
    private paused$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const onPause = () => this.paused.set(!this.player.isLoading());
        media.addEventListener('pause', onPause);
        const onPlay = () => this.paused.set(false);
        media.addEventListener('play', onPlay);
        onCleanup(() => {
            media.removeEventListener('pause', onPause);
            media.removeEventListener('play', onPlay);
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
