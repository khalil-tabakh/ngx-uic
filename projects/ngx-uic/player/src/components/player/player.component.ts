import { Component, DOCUMENT, ElementRef, Renderer2, afterNextRender, effect, inject, linkedSignal, model } from '@angular/core';

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
    private renderer = inject(Renderer2);

    readonly audio = model<HTMLAudioElement>();
    readonly video = model<HTMLVideoElement>();

    readonly audioSources = linkedSignal(() => Array.from(this.audio()?.getElementsByTagName('source') || []));
    readonly videoSources = linkedSignal(() => Array.from(this.video()?.getElementsByTagName('source') || []));
    readonly videoTracks = linkedSignal(() => Array.from(this.video()?.getElementsByTagName('track') || []));

    private audioLoading = signal(false);
    private videoLoading = signal(false);

    private paused = linkedSignal(() => this.video()?.paused ?? this.audio()?.paused ?? true);

    readonly isLoading = computed(() => this.audioLoading() || this.videoLoading());
    readonly isPaused = this.paused.asReadonly();

    private audioSources$ = effect((onCleanup) => {
        const unlistenErrors = this.audioSources().map((oldSource) => {
            return this.renderer.listen(oldSource, 'error', () => {
                oldSource.remove();
                this.audioSources.update((audioSources) => audioSources.filter((newSource) => newSource !== oldSource));
            });
        });
        onCleanup(() => unlistenErrors.forEach((unlistenError) => unlistenError()));
    });
    private videoSources$ = effect((onCleanup) => {
        const unlistenErrors = this.videoSources().map((oldSource) => {
            return this.renderer.listen(oldSource, 'error', () => {
                oldSource.remove();
                this.videoSources.update((videoSources) => videoSources.filter((newSource) => newSource !== oldSource));
            });
        });
        onCleanup(() => unlistenErrors.forEach((unlistenError) => unlistenError()));
    });
    private videoTracks$ = effect((onCleanup) => {
        const unlistenErrors = this.videoTracks().map((oldTrack) => {
            return this.renderer.listen(oldTrack, 'error', () => {
                oldTrack.remove();
                this.videoTracks.update((videoTracks) => videoTracks.filter((newTrack) => newTrack !== oldTrack));
            });
        });
        onCleanup(() => unlistenErrors.forEach((unlistenError) => unlistenError()));
    });

    private isLoading$ = effect((onCleanup) => {
        const audio = this.audio();
        const video = this.video();
        const onAudioCanplay = () => this.audioLoading.set(false);
        audio?.addEventListener('canplay', onAudioCanplay);
        const onAudioEmptied = () => this.audioLoading.set(false);
        audio?.addEventListener('emptied', onAudioEmptied);
        const onAudioLoadstart = () => this.audioLoading.set(true);
        audio?.addEventListener('loadstart', onAudioLoadstart);
        const onAudioWaiting = () => this.audioLoading.set(audio?.readyState !== audio?.HAVE_NOTHING);
        audio?.addEventListener('waiting', onAudioWaiting);
        const onVideoCanplay = () => this.videoLoading.set(false);
        video?.addEventListener('canplay', onVideoCanplay);
        const onVideoEmptied = () => this.videoLoading.set(false);
        video?.addEventListener('emptied', onVideoEmptied);
        const onVideoLoadstart = () => this.videoLoading.set(true);
        video?.addEventListener('loadstart', onVideoLoadstart);
        const onVideoWaiting = () => this.videoLoading.set(video?.readyState !== video?.HAVE_NOTHING);
        video?.addEventListener('waiting', onVideoWaiting);
        onCleanup(() => {
            audio?.removeEventListener('canplay', onAudioCanplay);
            audio?.removeEventListener('emptied', onAudioEmptied);
            audio?.removeEventListener('loadstart', onAudioLoadstart);
            audio?.removeEventListener('waiting', onAudioWaiting);
            video?.removeEventListener('canplay', onVideoCanplay);
            video?.removeEventListener('emptied', onVideoEmptied);
            video?.removeEventListener('loadstart', onVideoLoadstart);
            video?.removeEventListener('waiting', onVideoWaiting);
        });
    });
    private isPaused$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.video() || this.audio();
        if (!media) return;
        const onPause = () => this.paused.set(!this.isLoading());
        media.addEventListener('pause', onPause);
        const onPlay = () => this.paused.set(false);
        media.addEventListener('play', onPlay);
        onCleanup(() => {
            media.removeEventListener('pause', onPause);
            media.removeEventListener('play', onPlay);
        });
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
                if (audio.readyState !== audio.HAVE_NOTHING) audio.pause();
                if (video.readyState !== video.HAVE_NOTHING) video.pause();
            } else if (!untracked(this.isPaused)) {
                const drift = Math.abs(audio.currentTime - video.currentTime);
                if (drift > 0.1) audio.currentTime = video.currentTime;
                const audioPlayable = audio.readyState !== audio.HAVE_NOTHING;
                if (audioPlayable) audio.play().catch(() => {});
                const videoPlayable = video.readyState !== video.HAVE_NOTHING && (!audio.paused || !audioPlayable);
                if (videoPlayable) video.play().catch(() => {});
            }
        }
    });

    protected onTogglePlay(): void {
        this.paused.update((paused) => !paused);
        if (this.isLoading()) return;
        const audio = this.audio();
        if (audio && audio.readyState !== audio.HAVE_NOTHING) this.isPaused() ? audio.pause() : audio.play().catch(() => {});
        const video = this.video();
        if (video && video.readyState !== video.HAVE_NOTHING) this.isPaused() ? video.pause() : video.play().catch(() => {});
    }

    protected onToggleFullscreen(): void {
        this.document.fullscreenElement
            ? this.document.exitFullscreen()
            : this.element.requestFullscreen();
    }
}
