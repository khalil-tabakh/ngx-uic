import { Component, DOCUMENT, ElementRef, afterRenderEffect, computed, effect, inject, linkedSignal, model, signal, untracked } from '@angular/core';

@Component({
    selector: 'ngx-player',
    imports: [],
    templateUrl: './player.component.html',
    styleUrl: './player.component.scss',
    host: {
        '(click)': 'onTogglePlay()',
        '(dblclick)': 'onToggleFullscreen()'
    }
})
export class NgxPlayerComponent {
    private document = inject(DOCUMENT);
    private element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    readonly audio = model<HTMLAudioElement>();
    readonly video = model<HTMLVideoElement>();

    readonly audioSources = linkedSignal(() => Array.from(this.audio()?.getElementsByTagName('source') || []));
    readonly videoSources = linkedSignal(() => Array.from(this.video()?.getElementsByTagName('source') || []));
    readonly videoTracks = linkedSignal(() => Array.from(this.video()?.getElementsByTagName('track') || []));

    readonly audioSource = linkedSignal<HTMLSourceElement[], HTMLSourceElement | undefined>({
        source: this.audioSources,
        computation: (sources, previous) => previous?.value && sources.find((source) => source === previous?.value)
    });
    readonly videoSource = linkedSignal<HTMLSourceElement[], HTMLSourceElement | undefined>({
        source: this.videoSources,
        computation: (sources, previous) => previous?.value && sources.find((source) => source === previous?.value)
    });

    private audioLoading = signal(false);
    private videoLoading = signal(false);

    private paused = linkedSignal(() => this.video()?.paused ?? this.audio()?.paused ?? true);

    readonly isLoading = computed(() => this.audioLoading() || this.videoLoading());
    readonly isPaused = this.paused.asReadonly();

    private audioSources$ = effect((onCleanup) => {
        const controller = new AbortController();
        this.audioSources().forEach((source) => source.addEventListener('error', (event) => {
            this.audioSources.update((sources) => this.deleteElement(sources, source));
        }, { signal: controller.signal }));
        onCleanup(() => controller.abort());
    });
    private videoSources$ = effect((onCleanup) => {
        const controller = new AbortController();
        this.videoSources().forEach((source) => source.addEventListener('error', (event) => {
            this.videoSources.update((sources) => this.deleteElement(sources, source));
        }, { signal: controller.signal }));
        onCleanup(() => controller.abort());
    });
    private videoTracks$ = effect((onCleanup) => {
        const controller = new AbortController();
        this.videoTracks().forEach((track) => track.addEventListener('error', () => {
            this.videoTracks.update((tracks) => this.deleteElement(tracks, track))
        }, { signal: controller.signal }));
        onCleanup(() => controller.abort());
    });

    private audioSource$ = effect((onCleanup) => {
        const audio = this.audio();
        if (!audio) return;
        const controller = new AbortController();
        audio.addEventListener('emptied', () => !audio.networkState && this.audioSource.set(undefined), { signal: controller.signal });
        audio.addEventListener('loadstart', () => {
            const source = this.audioSources().find((source) => source.src === audio.currentSrc);
            if (source) this.audioSource.set(source);
        }, { signal: controller.signal });
        onCleanup(() => controller.abort());
    });
    private videoSource$ = effect((onCleanup) => {
        const video = this.video();
        if (!video) return;
        const controller = new AbortController();
        video.addEventListener('emptied', () => !video.networkState && this.videoSource.set(undefined), { signal: controller.signal });
        video.addEventListener('loadstart', () => {
            const source = this.videoSources().find((source) => source.src === video.currentSrc);
            if (source) this.videoSource.set(source);
        }, { signal: controller.signal });
        onCleanup(() => controller.abort());
    });

    private isLoading$ = effect((onCleanup) => {
        const audio = this.audio();
        const video = this.video();
        const controller = new AbortController();
        audio?.addEventListener('canplay', () => this.audioLoading.set(false), { signal: controller.signal });
        audio?.addEventListener('emptied', () => this.audioLoading.set(false), { signal: controller.signal });
        audio?.addEventListener('loadstart', () => this.audioLoading.set(true), { signal: controller.signal });
        audio?.addEventListener('waiting', () => this.audioLoading.set(!!audio?.networkState), { signal: controller.signal });
        video?.addEventListener('canplay', () => this.videoLoading.set(false), { signal: controller.signal });
        video?.addEventListener('emptied', () => this.videoLoading.set(false), { signal: controller.signal });
        video?.addEventListener('loadstart', () => this.videoLoading.set(true), { signal: controller.signal });
        video?.addEventListener('waiting', () => this.videoLoading.set(!!video?.networkState), { signal: controller.signal });
        onCleanup(() => controller.abort());
    });
    private isPaused$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.video() || this.audio();
        if (!media) return;
        const controller = new AbortController();
        media.addEventListener('pause', () => this.paused.set(!this.isLoading()), { signal: controller.signal });
        media.addEventListener('play', () => this.paused.set(false), { signal: controller.signal });
        onCleanup(() => controller.abort());
    });

    private sync$ = afterRenderEffect({
        earlyRead: () => {
            if (!this.audio()) this.audio.set(this.element.getElementsByTagName('audio')[0]);
            if (!this.video()) this.video.set(this.element.getElementsByTagName('video')[0]);
        },
        write: () => {
            const audio = this.audio();
            const video = this.video();
            if (!audio || !video) return;
            if (this.isLoading()) {
                if (!!audio.networkState) audio.pause();
                if (!!video.networkState) video.pause();
            } else if (!untracked(this.isPaused)) {
                const drift = Math.abs(audio.currentTime - video.currentTime);
                if (drift > 0.1) audio.currentTime = video.currentTime;
                const audioPlayable = !!audio.networkState;
                if (audioPlayable) audio.play().catch(() => {});
                const videoPlayable = !!video.networkState && (!audio.paused || !audioPlayable);
                if (videoPlayable) video.play().catch(() => {});
            }
        }
    });

    private deleteElement<T extends HTMLElement>(sources: T[], source: T): T[] {
        source.remove();
        return sources.filter((s) => s !== source);
    }

    protected onTogglePlay(): void {
        this.paused.update((paused) => !paused);
        if (this.isLoading()) return;
        const audio = this.audio();
        if (!!audio?.networkState) this.isPaused() ? audio.pause() : audio.play().catch(() => {});
        const video = this.video();
        if (!!video?.networkState) this.isPaused() ? video.pause() : video.play().catch(() => {});
    }

    protected onToggleFullscreen(): void {
        this.document.fullscreenElement
            ? this.document.exitFullscreen()
            : this.element.requestFullscreen();
    }
}
