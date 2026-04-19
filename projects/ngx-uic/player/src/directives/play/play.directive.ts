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
        const controller = new AbortController();
        media.addEventListener('canplay', () => this.ended.set(false), { signal: controller.signal });
        media.addEventListener('ended', () => this.ended.set(true), { signal: controller.signal });
        onCleanup(() => controller.abort());
    });
    private paused$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const controller = new AbortController();
        media.addEventListener('pause', () => this.paused.set(!this.player.isLoading()), { signal: controller.signal });
        media.addEventListener('play', () => this.paused.set(false), { signal: controller.signal });
        onCleanup(() => controller.abort());
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
