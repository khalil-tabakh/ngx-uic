import { DOCUMENT, Directive, ResourceSnapshot, computed, effect, inject, linkedSignal, resource, untracked } from '@angular/core';
import { MediaPlayer, MediaPlayerClass, Representation } from 'dashjs';
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

    private language = computed(() => !this.player.audioSource() ? this.player.videoSource()?.lang || this.player.video()?.lang : undefined);

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
                    case 'mpd':
                        const dash = MediaPlayer().create();
                        dash.initialize(video, source.src);
                        dash.on('error', () => {
                            dash.destroy();
                            return reject(source);
                        });
                        dash.on('streamInitialized', () => {
                            const representations = dash.getRepresentationsByType('video');
                            const resolutions = representations.map((representation) => this.getResolution(dash, representation));
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
            }, [] as HTMLSourceElement[]);
        }
    }).asReadonly();

    readonly isAutomatable = linkedSignal<ResourceSnapshot<HTMLSourceElement[]>, boolean>({
        source: this.sources.snapshot,
        computation: (sources, previous) => sources.status == 'resolved'
            ? sources.value.some((source) => source.dataset['resolution']!.split(',').length > 1)
            : previous?.value || false
    }).asReadonly();
    readonly resolutions = linkedSignal<ResourceSnapshot<HTMLSourceElement[]>, number[]>({
        source: this.sources.snapshot,
        computation: (sources, previous) => sources.status == 'resolved'
            ? new Set(sources.value.flatMap((source) => source.dataset['resolution']!.split(',').map(Number))).values().toArray()
            : previous?.value || []
    }).asReadonly();

    readonly resolution = linkedSignal<number[], number>({
        source: this.resolutions,
        computation: (resolutions, previous) => {
            const video = this.player.video();
            const newResolution = resolutions.find((resolution) => resolution === Number(video?.dataset['resolution']));
            const oldResolution = resolutions.find((resolution) => resolution === previous?.value);
            return newResolution || oldResolution || resolutions.at(0) || 0;
        }
    });

    readonly auto = linkedSignal<HTMLSourceElement | undefined, boolean>({
        source: this.player.videoSource,
        computation: (source, previous) => !previous?.source
            ? ['mpd'].includes(source?.src.split('?')[0].split('.').at(-1)!)
            : source
                ? previous?.value || !source.dataset['resolution']?.split(',').map(Number).includes(this.resolution())
                : previous?.value || false
    });

    private auto$ = effect((onCleanup) => {
        const dash = this.player.videoDash();
        if (!dash) return;
        const onDynamicToStatic = () => this.auto.set(dash.getSettings().streaming?.abr?.autoSwitchBitrate?.video ?? true);
        dash.on('dynamicToStatic', onDynamicToStatic);
        onCleanup(() => dash.off('dynamicToStatic', onDynamicToStatic));
    });
    private resolution$ = effect((onCleanup) => {
        const video = this.player.video();
        if (!video) return;
        const mutation$ = new MutationObserver(() => this.resolution.set(Number(video?.dataset['resolution'] || '')));
        mutation$.observe(video, { attributeFilter: ['data-resolution'] });
        const onLoadedmetadata = () => {
            const source = this.player.videoSource();
            if (!source?.dataset['resolution']) this.resolution.set(0);
            else if (source.dataset['resolution'].split(',').length < 2) this.resolution.set(Number(source.dataset['resolution']));
            else if (this.auto()) this.resolution.set(this.getResolution(dash));
            else { /** Force retrigger the {@link switch$} effect */
                const resolution = this.resolution();
                this.resolution.set(0);
                this.resolution.set(resolution);
            }
        };
        video.addEventListener('loadedmetadata', onLoadedmetadata);
        const dash = this.player.videoDash();
        const onQualityChangeRequested = () => this.resolution.set(this.getResolution(dash));
        dash?.on('qualityChangeRequested', onQualityChangeRequested);
        onCleanup(() => {
            mutation$.disconnect();
            video.removeEventListener('loadedmetadata', onLoadedmetadata);
            dash?.off('qualityChangeRequested', onQualityChangeRequested);
        });
    });
    private switch$ = effect(() => {
        if (this.sources.isLoading()) return;
        const resolution = this.resolution() ? String(this.resolution()) : '';
        const video = this.player.video();
        if (video) this.reload(resolution, video, this.sources.value(), untracked(this.player.videoDash));
    });
    private toggle$ = effect(() => {
        const auto = this.auto();
        const dash = this.player.videoDash();
        dash?.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: auto } } } });
    });

    private reload(resolution: string, media: HTMLMediaElement, sources: HTMLSourceElement[], dash?: MediaPlayerClass): void {
        media.dataset['resolution'] = resolution;
        const currentSources = sources.toReversed().filter((source) => {
            const isSameResolution = this.isAutomatable() && this.auto()
                ? source.dataset['resolution']!.split(',').length > 1
                : !resolution || source.dataset['resolution']!.split(',').includes(resolution);
            return isSameResolution ? !Boolean(media.prepend(source)) : Boolean(source.remove());
        });
        switch (true) {
            case currentSources.some((currentSource) => currentSource.src === dash?.getSource()):
                const representations = dash?.getRepresentationsByType('video');
                const representation = representations?.find((representation) => this.getResolution(dash, representation) === Number(resolution));
                if (representation) dash!.setRepresentationForTypeById('video', representation.id, true);
                break;
            case currentSources.every((currentSource) => currentSource.src !== media.currentSrc):
                const currentTime = media.currentTime || 0;
                media.removeAttribute('src');
                media.load();
                if (currentSources.length) media.addEventListener('loadedmetadata', () => media.currentTime = currentTime, { once: true });
                break;
        }
    }
    
    private getResolution(dash?: MediaPlayerClass, representation?: Representation): number {
        representation ||= dash?.getCurrentRepresentationForType('video') ?? undefined;
        return dash && representation ? this.toResolution(representation.height, representation.width) : this.resolution();
    }

    private toResolution(height: number, width: number): number {
        return Math.min(height, width);
    }
}
