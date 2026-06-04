import { Directive, effect, inject, linkedSignal, resource, signal } from '@angular/core';
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

    readonly ended = resource<boolean, HTMLMediaElement | undefined>({
        defaultValue: false,
        params: () => this.player.video() || this.player.audio(),
        stream: async ({ abortSignal, params: media }) => {
            const response = signal({ value: media.ended });
            media.addEventListener('canplay', () => response.set({ value: false }), { signal: abortSignal });
            media.addEventListener('ended', () => response.set({ value: true }), { signal: abortSignal });
            return response;
        }
    }).asReadonly();

    readonly paused = linkedSignal(() => this.player.video()?.paused ?? this.player.audio()?.paused ?? true);

    private paused$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const controller = new AbortController();
        media.addEventListener('pause', () => this.paused.set(!this.player.isLoading.value()), { signal: controller.signal });
        media.addEventListener('play', () => this.paused.set(false), { signal: controller.signal });
        onCleanup(() => controller.abort());
    });
    private toggle$ = effect(() => {
        const audio = this.player.audio();
        const video = this.player.video();
        if (this.player.isLoading.value()) {
            if (!!audio?.networkState) audio.pause();
            if (!!video?.networkState) video.pause();
            return;
        }
        if (audio && video) {
            const drift = Math.abs(audio.currentTime - video.currentTime);
            if (drift > 0.1) audio.currentTime = video.currentTime;
        }
        if (!!audio?.networkState) this.paused() ? audio.pause() : audio.play().catch(() => {});
        if (!!video?.networkState) this.paused() ? video.pause() : video.play().catch(() => {});
    });
}
