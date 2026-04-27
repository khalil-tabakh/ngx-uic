import { DOCUMENT, Directive, computed, effect, inject, linkedSignal, resource } from '@angular/core';
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

    private language = linkedSignal({
        source: () => ({ audioSource: this.player.audioSource(), videoSource: this.player.videoSource() }),
        computation: (source, previous) => source.audioSource?.lang || source.videoSource?.lang || previous?.value
    }).asReadonly();

    private sources = resource({
        defaultValue: [],
        params: () => ({ language: this.language(), sources: this.player.videoSources() }),
        loader: async (request) => {
            const { language, sources } = request.params;
            const promises = sources.map((source) => new Promise<HTMLSourceElement>((resolve, reject) => {
                if (Number(source.dataset['resolution'])) return resolve(source);
                const video = this.document.createElement('video');
                video.preload = 'metadata';
                video.src = source.src;
                video.onerror = () => reject(source);
                video.onloadedmetadata = () => {
                    const resolution = Math.min(video.videoHeight, video.videoWidth);
                    source.dataset['resolution'] = String(resolution);
                    return resolve(source);
                };
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

    readonly resolutions = linkedSignal<HTMLSourceElement[], number[]>({
        source: this.sources.value,
        computation: (sources, previous) => {
            if (this.sources.isLoading()) return previous?.value || [];
            const resolutions = sources.flatMap((source) => source.dataset['resolution']?.split(',').map(Number) || []);
            return new Set(resolutions).values().toArray();
        }
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

    private resolution$ = effect((onCleanup) => {
        const video = this.player.video();
        if (!video) return;
        const mutation$ = new MutationObserver(() => this.resolution.set(Number(video?.dataset['resolution'] || '')));
        mutation$.observe(video, { attributeFilter: ['data-resolution'] });
        const onLoadstart = () => {
            const source = this.sources.value().find((source) => source.src === video.currentSrc);
            this.resolution.set(Number(source?.dataset['resolution'] || ''));
        };
        video.addEventListener('loadstart', onLoadstart);
        onCleanup(() => {
            mutation$.disconnect();
            video.removeEventListener('loadstart', onLoadstart);
        });
    });
    private switch$ = effect(() => {
        if (this.sources.isLoading()) return;
        const resolution = this.resolution() ? String(this.resolution()) : '';
        const video = this.player.video();
        if (video) this.reload(resolution, video, this.sources.value());
    });

    private reload(resolution: string, media: HTMLMediaElement, sources: HTMLSourceElement[]): void {
        media.dataset['resolution'] = resolution;
        const currentSources = sources.toReversed().filter((source) => {
            const isSameResolution = !resolution || source.dataset['resolution']!.split(',').includes(resolution);
            return isSameResolution ? !Boolean(media.prepend(source)) : Boolean(source.remove());
        });
        if (currentSources.find((currentSource) => currentSource.src === media.currentSrc)) return;
        const currentTime = media.currentTime || 0;
        media.load();
        media.currentTime = currentTime;
    }
}
