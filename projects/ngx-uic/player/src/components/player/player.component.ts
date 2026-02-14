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

    private sync$ = effect((onCleanup) => {
        const audio = this.audio();
        const video = this.video();
        if (!audio || !video) return;
        const unlistenPause = this.renderer.listen(video, 'pause', () => !!audio.currentSrc && audio.pause());
        const unlistenPlaying = this.renderer.listen(video, 'playing', () => {
            audio.currentTime = video.currentTime;
            if (audio.currentSrc) audio.play().catch();
        });
        const unlistenWaiting = this.renderer.listen(video, 'waiting', () => !!audio.currentSrc && audio.pause());
        onCleanup(() => {
            unlistenPause();
            unlistenPlaying();
            unlistenWaiting();
        });
    });

    private init = afterNextRender({
        read: () => {
            if (!this.audio()) this.audio.set(this.element.getElementsByTagName('audio')[0]);
            if (!this.video()) this.video.set(this.element.getElementsByTagName('video')[0]);
        }
    });

    protected onTogglePlay(): void {
        const media = this.video() || this.audio();
        if (media?.currentSrc) media.paused ? media.play().catch(() => {}) : media.pause();
    }

    protected onToggleFullscreen(): void {
        this.document.fullscreenElement
            ? this.document.exitFullscreen()
            : this.element.requestFullscreen();
    }
}
