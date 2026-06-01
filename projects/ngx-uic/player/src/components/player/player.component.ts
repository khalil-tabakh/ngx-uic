import { ChangeDetectionStrategy, Component, ElementRef, computed, contentChild, effect, inject, input, linkedSignal, resource, signal } from '@angular/core';
import { MediaPlayer, MediaPlayerSettingClass } from 'dashjs';
import Hls, { HlsConfig } from 'hls.js';

@Component({
    selector: 'ngx-player, [ngx-player]',
    templateUrl: './player.component.html',
    styleUrl: './player.component.scss',
    exportAs: 'ngxPlayer',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxPlayerComponent {
    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    readonly audioDashConfig = input<MediaPlayerSettingClass>({});
    readonly audioHLSConfig = input<Partial<HlsConfig>>();
    readonly videoDashConfig = input<MediaPlayerSettingClass>({});
    readonly videoHLSConfig = input<Partial<HlsConfig>>();

    private audioRef = contentChild<HTMLAudioElement, ElementRef<HTMLAudioElement>>('audio', { read: ElementRef });
    private videoRef = contentChild<HTMLVideoElement, ElementRef<HTMLVideoElement>>('video', { read: ElementRef });

    readonly audio = computed(() => this.audioRef()?.nativeElement);
    readonly video = computed(() => this.videoRef()?.nativeElement);

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

    readonly audioDash = resource({
        params: () => ({ config: this.audioDashConfig(), media: this.audio(), source: this.audioSource() }),
        loader: async ({ abortSignal, params }) => {
            const { config, media, source } = params;
            if (!source?.src.split('?')[0].endsWith('.mpd')) return;
            const dash = MediaPlayer().create();
            dash.initialize(media, source.src, media?.autoplay);
            dash.updateSettings(config);
            dash.on('error', () => source.dispatchEvent(new Event('error')));
            abortSignal.addEventListener('abort', () => dash.destroy());
            return dash;
        }
    }).asReadonly();
    readonly audioHLS = resource({
        params: () => ({ config: this.audioHLSConfig(), media: this.audio(), source: this.audioSource() }),
        loader: async ({ abortSignal, params }) => {
            const { config, media, source } = params;
            if (!source?.src.split('?')[0].endsWith('.m3u8')) return;
            const hls = new Hls(config);
            hls.attachMedia(media!);
            hls.loadSource(source.src);
            hls.on(Hls.Events.ERROR, (_, event) => event.fatal && source.dispatchEvent(new Event('error')));
            abortSignal.addEventListener('abort', () => hls.destroy());
            return hls;
        }
    }).asReadonly();
    readonly videoDash = resource({
        params: () => ({ config: this.videoDashConfig(), media: this.video(), source: this.videoSource() }),
        loader: async ({ abortSignal, params }) => {
            const { config, media, source } = params;
            if (!source?.src.split('?')[0].endsWith('.mpd')) return;
            const dash = MediaPlayer().create();
            dash.initialize(media, source.src, media?.autoplay);
            dash.updateSettings(config);
            dash.on('error', () => source.dispatchEvent(new Event('error')));
            abortSignal.addEventListener('abort', () => dash.destroy());
            return dash;
        }
    }).asReadonly();
    readonly videoHLS = resource({
        params: () => ({ config: this.videoHLSConfig(), media: this.video(), source: this.videoSource() }),
        loader: async ({ abortSignal, params }) => {
            const { config, media, source } = params;
            if (!source?.src.split('?')[0].endsWith('.m3u8')) return;
            const hls = new Hls(config);
            hls.attachMedia(media!);
            hls.loadSource(source.src);
            hls.on(Hls.Events.ERROR, (_, event) => event.fatal && source.dispatchEvent(new Event('error')));
            abortSignal.addEventListener('abort', () => hls.destroy());
            return hls;
        }
    }).asReadonly();

    readonly isLoading = resource({
        defaultValue: false,
        params: () => ({ audio: this.audio(), video: this.video() }),
        stream: async ({ abortSignal, params }) => {
            const { audio, video } = params;
            const audioLoading = signal(false);
            const videoLoading = signal(false);
            audio?.addEventListener('canplay', () => audioLoading.set(false), { signal: abortSignal });
            audio?.addEventListener('emptied', () => audioLoading.set(false), { signal: abortSignal });
            audio?.addEventListener('loadstart', () => audioLoading.set(true), { signal: abortSignal });
            audio?.addEventListener('waiting', () => audioLoading.set(!!audio?.networkState), { signal: abortSignal });
            video?.addEventListener('canplay', () => videoLoading.set(false), { signal: abortSignal });
            video?.addEventListener('emptied', () => videoLoading.set(false), { signal: abortSignal });
            video?.addEventListener('loadstart', () => videoLoading.set(true), { signal: abortSignal });
            video?.addEventListener('waiting', () => videoLoading.set(!!video?.networkState), { signal: abortSignal });
            return computed(() => ({ value: audioLoading() || videoLoading() }));
        }
    }).asReadonly();

    private audioSources$ = effect((onCleanup) => {
        const controller = new AbortController();
        this.audioSources().forEach((source) => source.addEventListener('error', (event) => {
            if (event.isTrusted && ['m3u8', 'mpd'].includes(source.src.split('?')[0].split('.').at(-1)!)) return;
            if (navigator.onLine) this.audioSources.update((sources) => this.deleteElement(sources, source));
        }, { signal: controller.signal }));
        onCleanup(() => controller.abort());
    });
    private videoSources$ = effect((onCleanup) => {
        const controller = new AbortController();
        this.videoSources().forEach((source) => source.addEventListener('error', (event) => {
            if (event.isTrusted && ['m3u8', 'mpd'].includes(source.src.split('?')[0].split('.').at(-1)!)) return;
            if (navigator.onLine) this.videoSources.update((sources) => this.deleteElement(sources, source));
        }, { signal: controller.signal }));
        onCleanup(() => controller.abort());
    });
    private videoTracks$ = effect((onCleanup) => {
        const controller = new AbortController();
        this.videoTracks().forEach((track) => track.addEventListener('error', () => {
            if (navigator.onLine) this.videoTracks.update((tracks) => this.deleteElement(tracks, track))
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

    private deleteElement<T extends HTMLElement>(sources: T[], source: T): T[] {
        source.remove();
        return sources.filter((s) => s !== source);
    }
}
