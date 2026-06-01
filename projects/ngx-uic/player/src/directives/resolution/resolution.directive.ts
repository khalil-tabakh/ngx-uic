import { DOCUMENT, Directive, ResourceSnapshot, computed, effect, inject, linkedSignal, resource, untracked } from '@angular/core';
import { MediaPlayer, MediaPlayerClass, Representation } from 'dashjs';
import Hls, { Level } from 'hls.js';
import { NgxPlayerComponent } from '../../components/player/player.component';

@Directive({
    selector: '[ngxResolution]',
    host: {
        '(click)': '$event.stopPropagation()',
        '(dblclick)': '$event.stopPropagation()'
    },
    exportAs: 'ngxResolution'
})
export class NgxResolutionDirective {
    private document = inject(DOCUMENT);
    private player = inject(NgxPlayerComponent);

    private language = computed(() => !this.player.audioSource() ? this.player.videoSource()?.lang || this.player.video.value()?.lang : undefined);

    private sources = resource({
        defaultValue: [],
        params: () => ({ language: this.language(), sources: this.player.videoSources() }),
        loader: async (request) => {
            const { language, sources } = request.params;
            const promises = sources.map((source) => new Promise<HTMLSourceElement>((resolve, reject) => {
                if (source.dataset['resolution']) {
                    source.dataset['resolution'] = source.dataset['resolution'].split(',').filter(Number).toString();
                    if (source.dataset['resolution']) return resolve(source);
                }
                const video = this.document.createElement('video');
                switch (source.src.split('?')[0].split('.').at(-1)) {
                    case 'm3u8':
                        const hls = new Hls();
                        hls.attachMedia(video);
                        hls.loadSource(source.src);
                        hls.on(Hls.Events.ERROR, (_, data) => {
                            if (!data.fatal) return;
                            hls.destroy();
                            return reject(source);
                        });
                        hls.on(Hls.Events.MANIFEST_PARSED, () => {
                            const resolutions = hls.levels.map((level) => this.getHLSResolution(hls, level));
                            source.dataset['resolution'] = new Set(resolutions).values().toArray().toString();
                            hls.destroy();
                            return resolve(source);
                        });
                        break;
                    case 'mpd':
                        const dash = MediaPlayer().create();
                        dash.initialize(video, source.src);
                        dash.on('error', () => {
                            dash.destroy();
                            return reject(source);
                        });
                        dash.on('streamInitialized', () => {
                            const representations = dash.getRepresentationsByType('video');
                            const resolutions = representations.map((representation) => this.getDashResolution(dash, representation));
                            source.dataset['resolution'] = new Set(resolutions).values().toArray().toString();
                            dash.destroy();
                            return resolve(source);
                        });
                        break;
                    default:
                        video.preload = 'metadata';
                        video.src = source.src;
                        video.onerror = () => reject(source);
                        video.onloadedmetadata = () => {
                            const resolution = this.toResolution(video.videoHeight, video.videoWidth);
                            video.removeAttribute('src');
                            video.load();
                            source.dataset['resolution'] = String(resolution);
                            return resolve(source);
                        };
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
            }, [] as HTMLSourceElement[]) as readonly HTMLSourceElement[];
        }
    }).asReadonly();

    readonly isAutomatable = linkedSignal<ResourceSnapshot<readonly HTMLSourceElement[]>, boolean>({
        source: this.sources.snapshot,
        computation: (videoSources, previous) => {
            if (videoSources.status == 'resolved') {
                const sources = videoSources.value;
                return sources.some((source) => Number(source.dataset['resolution']?.split(',').length) > 1);
            } else return previous?.value || false;
        }
    }).asReadonly();
    readonly resolutions = linkedSignal<ResourceSnapshot<readonly HTMLSourceElement[]>, readonly number[]>({
        source: this.sources.snapshot,
        computation: (videoSources, previous) => {
            if (videoSources.status == 'resolved') {
                const sources = videoSources.value;
                const resolutions = sources.flatMap((source) => source.dataset['resolution']?.split(',').filter(Number).map(Number) || []);
                return new Set(resolutions).values().toArray();
            } else return previous?.value || [];
        }
    }).asReadonly();

    readonly resolution = linkedSignal<readonly number[], number>({
        source: this.resolutions,
        computation: (resolutions, previous) => {
            const video = this.player.video.value();
            const newResolution = resolutions.find((resolution) => resolution === Number(video?.dataset['resolution']));
            const oldResolution = resolutions.find((resolution) => resolution === previous?.value);
            return newResolution || oldResolution || resolutions.at(0) || 0;
        }
    });

    readonly auto = linkedSignal<HTMLSourceElement | undefined, boolean>({
        source: this.player.videoSource,
        computation: (source, previous) => !previous?.source
            ? ['m3u8', 'mpd'].includes(source?.src.split('?')[0].split('.').at(-1)!)
            : source
                ? previous?.value || !source.dataset['resolution']?.split(',').map(Number).includes(this.resolution())
                : previous?.value || false
    });

    private auto$ = effect((onCleanup) => {
        const dash = this.player.videoDash.value();
        const onDynamicToStatic = () => this.auto.set(dash?.getSettings().streaming?.abr?.autoSwitchBitrate?.video ?? true);
        dash?.on('dynamicToStatic', onDynamicToStatic);
        const hls = this.player.videoHLS.value();
        const onHlsLevelSwitched = () => this.auto.set(hls?.autoLevelEnabled ?? true);
        hls?.on(Hls.Events.LEVEL_SWITCHED, onHlsLevelSwitched);
        onCleanup(() => {
            dash?.off('dynamicToStatic', onDynamicToStatic);
            hls?.off(Hls.Events.LEVEL_SWITCHED, onHlsLevelSwitched);
        });
    });
    private resolution$ = effect((onCleanup) => {
        const video = this.player.video.value();
        if (!video) return;
        const mutation$ = new MutationObserver(() => this.resolution.set(Number(video?.dataset['resolution'] || '')));
        mutation$.observe(video, { attributeFilter: ['data-resolution'] });
        const onLoadedmetadata = () => {
            const source = this.player.videoSource();
            if (!source?.dataset['resolution']) this.resolution.set(0);
            else if (source.dataset['resolution'].split(',').length < 2) this.resolution.set(Number(source.dataset['resolution']));
            else if (this.auto() && dash) this.resolution.set(this.getDashResolution(dash));
            else if (this.auto() && hls) this.resolution.set(this.getHLSResolution(hls));
            else { /** Force retrigger the {@link switch$} effect */
                const resolution = this.resolution();
                this.resolution.set(0);
                this.resolution.set(resolution);
            }
        };
        video.addEventListener('loadedmetadata', onLoadedmetadata);
        const dash = this.player.videoDash.value();
        const onQualityChangeRequested = () => this.resolution.set(this.getDashResolution(dash));
        dash?.on('qualityChangeRequested', onQualityChangeRequested);
        const hls = this.player.videoHLS.value();
        const onHlsLevelSwitched = () => this.resolution.set(this.getHLSResolution(hls));
        hls?.on(Hls.Events.LEVEL_SWITCHED, onHlsLevelSwitched);
        onCleanup(() => {
            mutation$.disconnect();
            video.removeEventListener('loadedmetadata', onLoadedmetadata);
            dash?.off('qualityChangeRequested', onQualityChangeRequested);
            hls?.off(Hls.Events.LEVEL_SWITCHED, onHlsLevelSwitched);
        });
    });
    private switch$ = effect(() => {
        if (this.sources.isLoading()) return;
        const resolution = this.resolution() ? String(this.resolution()) : '';
        const video = this.player.video.value();
        if (video) this.reload(resolution, video, this.sources.value(), untracked(this.player.videoDash.value), untracked(this.player.videoHLS.value));
    });
    private toggle$ = effect(() => {
        const dash = this.player.videoDash.value();
        if (dash) dash.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: this.auto() } } } });
        const hls = this.player.videoHLS.value();
        if (hls && this.auto()) hls.currentLevel = -1;
    });

    private reload(resolution: string, media: HTMLMediaElement, sources: readonly HTMLSourceElement[], dash?: MediaPlayerClass, hls?: Hls): void {
        media.dataset['resolution'] = resolution;
        const isAuto = this.isAutomatable() && this.auto();
        const currentSources = sources.toReversed().filter((source) => {
            const isSameResolution = isAuto
                ? Number(source.dataset['resolution']?.split(',').length) > 1
                : !resolution || source.dataset['resolution']?.split(',').includes(resolution);
            return isSameResolution ? !Boolean(media.prepend(source)) : Boolean(source.remove());
        });
        switch (true) {
            case currentSources.some((currentSource) => currentSource.src === dash?.getSource()):
                const representations = dash!.getRepresentationsByType('video');
                const representation = representations.find((representation) => this.getDashResolution(dash, representation) === Number(resolution));
                if (representation) dash!.setRepresentationForTypeById('video', representation.id, true);
                break;
            case currentSources.some((currentSource) => currentSource.src === hls?.url):
                const index = hls?.levels.findIndex((level) => this.getHLSResolution(hls, level) === Number(resolution));
                if (index !== undefined && !isAuto) hls!.currentLevel = index;
                break;
            case currentSources.every((currentSource) => currentSource.src !== media.currentSrc):
                const currentTime = media.currentTime || 0;
                media.removeAttribute('src');
                media.load();
                if (currentSources.length) media.addEventListener('loadedmetadata', () => media.currentTime = currentTime, { once: true });
                break;
        }
    }

    private getDashResolution(dash?: MediaPlayerClass, representation?: Representation): number {
        representation ||= dash?.getCurrentRepresentationForType('video') ?? undefined;
        return dash && representation ? this.toResolution(representation.height, representation.width) : this.resolution();
    }

    private getHLSResolution(hls?: Hls, level?: Level): number {
        level ||= hls?.levels.at(hls.currentLevel);
        return hls && level ? parseInt(level.name) || this.toResolution(level.height, level.width) : this.resolution();
    }

    private toResolution(height: number, width: number): number {
        return Math.min(height, width);
    }
}
