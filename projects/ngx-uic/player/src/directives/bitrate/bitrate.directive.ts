import { DOCUMENT, Directive, ResourceSnapshot, computed, effect, inject, linkedSignal, resource, untracked } from '@angular/core';
import { MediaPlayer, MediaPlayerClass, Representation } from 'dashjs';
import Hls, { MediaPlaylist } from 'hls.js';
import { NgxPlayerComponent } from '../../components/player/player.component';

@Directive({
    selector: '[ngxBitrate]',
    host: {
        '(click)': '$event.stopPropagation()',
        '(dblclick)': '$event.stopPropagation()'
    },
    exportAs: 'ngxBitrate'
})
export class NgxBitrateDirective {
    private document = inject(DOCUMENT);
    private player = inject(NgxPlayerComponent);

    private language = computed(() => this.player.audioSource()?.lang || this.player.audio.value()?.lang);

    private audioSources = resource({
        defaultValue: [],
        params: () => ({ language: this.language(), sources: this.player.audioSources() }),
        loader: async (request) => {
            const { language, sources } = request.params;
            const promises = sources.map((source) => new Promise<HTMLSourceElement>((resolve, reject) => {
                if (source.dataset['bitrate']) {
                    source.dataset['bitrate'] = source.dataset['bitrate'].split(',').filter(Number).toString();
                    if (source.dataset['bitrate']) return resolve(source);
                }
                const audio = this.document.createElement('audio');
                switch (source.src.split('?')[0].split('.').at(-1)) {
                    case 'm3u8':
                        const hls = new Hls();
                        hls.attachMedia(audio);
                        hls.loadSource(source.src);
                        hls.on(Hls.Events.ERROR, (_, data) => {
                            if (!data.fatal) return;
                            hls.destroy();
                            return reject(source);
                        });
                        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                            const bitrates = data.audioTracks.map((track) => this.getHLSBitrate(hls, track));
                            source.dataset['bitrate'] = new Set(bitrates).values().toArray().toString();
                            hls.destroy();
                            return resolve(source);
                        });
                        break;
                    case 'mpd':
                        const dash = MediaPlayer().create();
                        dash.initialize(audio, source.src);
                        dash.on('error', () => {
                            dash.destroy();
                            return reject(source);
                        });
                        dash.on('streamInitialized', () => {
                            const representations = dash.getRepresentationsByType('audio');
                            const bitrates = representations.map((representation) => this.getDashBitrate(dash, representation));
                            source.dataset['bitrate'] = new Set(bitrates).values().toArray().toString();
                            dash.destroy();
                            return resolve(source);
                        });
                        break;
                    default:
                        audio.preload = 'metadata';
                        audio.src = source.src;
                        audio.onerror = () => reject(source);
                        audio.onloadedmetadata = () => fetch(source.src, { method: 'HEAD' }).then((response) => {
                            if (!response.ok) return reject(source);
                            const bytes = Number(response.headers.get('content-length')) || 0;
                            const kbps = Math.round(bytes * 8 / 1024 / audio.duration);
                            const bitrate = this.toBitrate(kbps);
                            audio.removeAttribute('src');
                            audio.load();
                            source.dataset['bitrate'] = String(bitrate);
                            return bitrate ? resolve(source) : reject(source);
                        });
                        break;
                }
            }));
            const results = await Promise.allSettled(promises);
            return results.reduce((sources, result) => {
                if (result.status === 'fulfilled') {
                    const isSameLanguage = !language || language === result.value.lang;
                    isSameLanguage ? sources.push(result.value) : result.value.remove();
                } else result.reason.dispatchEvent(new Event('error'));
                return sources;
            }, [] as HTMLSourceElement[]);
        }
    }).asReadonly();
    private videoSources = resource({
        defaultValue: [],
        params: () => ({ source: this.player.videoSource(), sources: this.player.videoSources() }),
        loader: async (request) => {
            const { source, sources } = request.params;
            const promises = sources.map((source) => new Promise<HTMLSourceElement>((resolve, reject) => {
                if (source.dataset['bitrate']) {
                    source.dataset['bitrate'] = source.dataset['bitrate'].split(',').filter(Number).toString();
                    if (source.dataset['bitrate']) return resolve(source);
                }
                const video = this.document.createElement('video');
                switch (source.src.split('?')[0].split('.').at(-1)) {
                    case 'm3u8':
                        const hls = new Hls();
                        hls.on(Hls.Events.ERROR, (_, data) => {
                            if (!data.fatal) return;
                            hls.destroy();
                            return reject(source);
                        });
                        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                            const bitrates = data.audioTracks.map((track) => this.getHLSBitrate(hls, track));
                            source.dataset['bitrate'] = new Set(bitrates).values().toArray().toString();
                            hls.destroy();
                            return resolve(source);
                        });
                        hls.attachMedia(video);
                        hls.loadSource(source.src);
                        break;
                    case 'mpd':
                        const dash = MediaPlayer().create();
                        dash.initialize(video, source.src);
                        dash.on('error', () => {
                            dash.destroy();
                            return reject(source);
                        });
                        dash.on('streamInitialized', () => {
                            const representations = dash.getRepresentationsByType('audio');
                            const bitrates = representations.map((representation) => this.getDashBitrate(dash, representation));
                            source.dataset['bitrate'] = new Set(bitrates).values().toArray().toString();
                            dash.destroy();
                            return resolve(source);
                        });
                        break;
                    default:
                        reject(null);
                        break;
                }
            }));
            const results = await Promise.allSettled(promises);
            return results.reduce((sources, result) => {
                if (result.status === 'fulfilled') result.value === source && sources.push(result.value);
                else result.reason?.dispatchEvent(new Event('error'));
                return sources;
            }, [] as HTMLSourceElement[]);
        }
    }).asReadonly();

    readonly isAutomatable = linkedSignal<ResourceSnapshot<HTMLSourceElement[]>[], boolean>({
        source: () => [this.audioSources.snapshot(), this.videoSources.snapshot()],
        computation: ([audioSources, videoSources], previous) => {
            if (audioSources.status === 'resolved' && videoSources.status === 'resolved') {
                const sources = audioSources.value.length ? audioSources.value : videoSources.value;
                return sources.some((source) => Number(source.dataset['bitrate']?.split(',').length) > 1)
            } else return previous?.value || false;
        }
    }).asReadonly();
    readonly bitrates = linkedSignal<ResourceSnapshot<HTMLSourceElement[]>[], number[]>({
        source: () => [this.audioSources.snapshot(), this.videoSources.snapshot()],
        computation: ([audioSources, videoSources], previous) => {
            if (audioSources.status === 'resolved' && videoSources.status === 'resolved') {
                const sources = audioSources.value.length ? audioSources.value : videoSources.value;
                const bitrates = sources.flatMap((source) => source.dataset['bitrate']?.split(',').filter(Number).map(Number) || []);
                return new Set(bitrates).values().toArray()
            } else return previous?.value || [];
        }
    }).asReadonly();

    readonly bitrate = linkedSignal<number[], number>({
        source: this.bitrates,
        computation: (bitrates, previous) => {
            const audio = this.player.audio.value();
            const newBitrate = bitrates.find((bitrate) => bitrate === Number(audio?.dataset['bitrate']));
            const oldBitrate = bitrates.find((bitrate) => bitrate === previous?.value);
            return newBitrate || oldBitrate || bitrates.at(0) || 0;
        }
    });

    readonly auto = linkedSignal<HTMLSourceElement | undefined, boolean>({
        source: () => this.player.audioSource() || this.player.videoSource(),
        computation: (source, previous) => !previous?.source
            ? ['m3u8', 'mpd'].includes(source?.src.split('?')[0].split('.').at(-1)!)
            : source
                ? previous?.value || !source.dataset['bitrate']?.split(',').map(Number).includes(this.bitrate())
                : previous?.value || false
    });

    private auto$ = effect((onCleanup) => {
        const dash = this.player.audioDash.value();
        const onDynamicToStatic = () => this.auto.set(dash?.getSettings().streaming?.abr?.autoSwitchBitrate?.audio ?? false);
        dash?.on('dynamicToStatic', onDynamicToStatic);
        const hls = this.player.videoHLS.value();
        const onHlsAudioTrackSwitched = () => this.auto.set(hls?.audioTrack === -1);
        hls?.on(Hls.Events.AUDIO_TRACK_SWITCHED, onHlsAudioTrackSwitched);
        onCleanup(() => {
            dash?.off('dynamicToStatic', onDynamicToStatic);
            hls?.off(Hls.Events.AUDIO_TRACK_SWITCHED, onHlsAudioTrackSwitched);
        });
    });
    private bitrate$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.audio.value() || this.player.video.value();
        if (!media) return;
        const mutation$ = new MutationObserver(() => this.bitrate.set(Number(media.dataset['bitrate'] || '')));
        mutation$.observe(media, { attributeFilter: ['data-bitrate'] });
        const onLoadedmetadata = () => {
            const source = this.player.audioSource();
            if (!source?.dataset['bitrate']) this.bitrate.set(0);
            else if (source.dataset['bitrate'].split(',').length < 2) this.bitrate.set(Number(source.dataset['bitrate']));
            else if (this.auto() && dash) this.bitrate.set(this.getDashBitrate(dash));
            else if (this.auto() && hls) this.bitrate.set(this.getHLSBitrate(hls));
            else { /** Force retrigger the {@link switch$} effect */
                const bitrate = this.bitrate();
                this.bitrate.set(0);
                this.bitrate.set(bitrate);
            }
        };
        media.addEventListener('loadedmetadata', onLoadedmetadata);
        const dash = this.player.audioDash.value() || this.player.videoDash.value();
        const onQualityChangeRequested = () => this.bitrate.set(this.getDashBitrate(dash));
        dash?.on('qualityChangeRequested', onQualityChangeRequested);
        const hls = this.player.audioHLS.value() || this.player.videoHLS.value();
        const onHlsAudioTrackSwitched = () => this.bitrate.set(this.getHLSBitrate(hls));
        hls?.on(Hls.Events.AUDIO_TRACK_SWITCHED, onHlsAudioTrackSwitched);
        onCleanup(() => {
            mutation$.disconnect();
            media.removeEventListener('loadedmetadata', onLoadedmetadata);
            dash?.off('qualityChangeRequested', onQualityChangeRequested);
            hls?.off(Hls.Events.AUDIO_TRACK_SWITCHED, onHlsAudioTrackSwitched);
        });
    });
    private switch$ = effect(() => {
        if (this.audioSources.isLoading() || this.videoSources.isLoading()) return;
        const audioBitrate = this.bitrate() ? String(this.bitrate()) : '';
        const audio = this.player.audio.value();
        if (audio) this.reload(audioBitrate, audio, this.audioSources.value(), untracked(this.player.audioDash.value), untracked(this.player.audioHLS.value));
        const videoBitrate = !audio?.getElementsByTagName('source').length ? audioBitrate : '';;
        const video = this.player.video.value();
        if (video) this.reload(videoBitrate, video, this.videoSources.value(), untracked(this.player.videoDash.value), untracked(this.player.videoHLS.value));
    });
    private toggle$ = effect(() => {
        const dash = this.player.audioDash.value() || this.player.videoDash.value();
        if (dash) dash?.updateSettings({ streaming: { abr: { autoSwitchBitrate: { audio: this.auto() } } } });
        const hls = this.player.audioHLS.value() || this.player.videoHLS.value();
        if (hls && this.auto()) hls.audioTrack = -1;
    });

    private reload(bitrate: string, media: HTMLMediaElement, sources: HTMLSourceElement[], dash?: MediaPlayerClass, hls?: Hls): void {
        media.dataset['bitrate'] = bitrate;
        const isAuto = this.isAutomatable() && this.auto();
        const currentSources = sources.toReversed().filter((source) => {
            const isSameBitrate = isAuto
                ? Number(source.dataset['bitrate']?.split(',').length) > 1
                : !bitrate || source.dataset['bitrate']?.split(',').includes(bitrate);
            return isSameBitrate ? !Boolean(media.prepend(source)) : Boolean(source.remove());
        });
        switch (true) {
            case currentSources.some((currentSource) => currentSource.src === dash?.getSource()):
                const representations = dash!.getRepresentationsByType('audio');
                const representation = representations.find((representation) => this.getDashBitrate(dash, representation) === Number(bitrate));
                if (representation) dash!.setRepresentationForTypeById('audio', representation.id, true);
                break;
            case currentSources.some((currentSource) => currentSource.src === hls?.url):
                const index = hls?.audioTracks.findIndex((track) => this.getHLSBitrate(hls, track) === Number(bitrate));
                if (index !== undefined && !isAuto) hls!.audioTrack = index;
                break;
            case currentSources.every((currentSource) => currentSource.src !== media.currentSrc) && media instanceof HTMLAudioElement:
                const currentTime = media.currentTime || 0;
                media.removeAttribute('src');
                media.load();
                if (currentSources.length) media.addEventListener('loadedmetadata', () => media.currentTime = currentTime, { once: true });
                break;
        }
    }

    private getDashBitrate(dash?: MediaPlayerClass, representation?: Representation): number {
        representation ||= dash?.getCurrentRepresentationForType('audio') ?? undefined;
        return representation ? this.toBitrate(representation.bitrateInKbit) : this.bitrate();
    }

    private getHLSBitrate(hls?: Hls, track?: MediaPlaylist): number {
        track ||= hls?.audioTracks.at(hls.audioTrack);
        return track ? this.toBitrate(Math.round(track.bitrate / 1024)) : this.bitrate();
    }

    private toBitrate(kbps: number): number {
        return Math.round(kbps / 16) * 16;
    }
}
