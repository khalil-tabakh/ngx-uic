import { DOCUMENT, Directive, effect, inject, linkedSignal, resource } from '@angular/core';
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

    private sources = resource({
        defaultValue: [],
        params: this.player.videoSources,
        loader: async ({ params: sources }) => {
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
            return results.filter((result) => result.status === 'fulfilled').map((result) => result.value).reverse();
        }
    });

    readonly resolutions = linkedSignal(() => {
        const video = this.player.video();
        const sources = this.sources.value().reverse().filter((source) => source.lang === video?.lang || !video?.lang);
        const resolutions = sources.map((source) => Number(source.dataset['resolution']));
        return new Set(resolutions).values().toArray();
    });

    readonly resolution = linkedSignal(() => {
        const video = this.player.video();
        const source = this.sources.value().find((source) => source.src === video?.currentSrc);
        const resolution = Number(source?.dataset['resolution'] || video?.dataset['resolution'] || '');
        return this.resolutions().includes(resolution) ? resolution : 0;
    });

    private resolution$ = effect((onCleanup) => {
        const video = this.player.video();
        if (!video) return;
        const onLoadstart = () => {
            const source = this.sources.value().find((source) => source.src === video.currentSrc);
            this.resolution.set(Number(source?.dataset['resolution'] || ''));
        };
        video.addEventListener('loadstart', onLoadstart);
        const mutation$ = new MutationObserver(() => this.resolution.set(Number(video.dataset['resolution'] || '')));
        mutation$.observe(video, { attributeFilter: ['data-resolution'] });
        onCleanup(() => {
            video.removeEventListener('loadstart', onLoadstart);
            mutation$.disconnect();
        });
    });
    private resolutions$ = effect((onCleanup) => {
        const video = this.player.video();
        if (!video) return;
        const mutation$ = new MutationObserver(() => {
            const sources = this.sources.value().reverse().filter((source) => source.lang === video.lang || !video.lang);
            const resolutions = sources.map((source) => Number(source.dataset['resolution']));
            this.resolutions.set(new Set(resolutions).values().toArray());
        });
        mutation$.observe(video, { attributeFilter: ['lang'] });
        onCleanup(() => mutation$.disconnect());
    });
    private switch$ = effect(() => {
        const video = this.player.video();
        if (!video) return;
        const resolution = this.resolution() ? String(this.resolution()) : '';
        video.dataset['resolution'] = resolution;
        const currentSources = this.sources.value().filter((source) => {
            const isSameLanguage = source.lang === video.lang || !video.lang;
            const isSameResolution = source.dataset['resolution'] === resolution || !resolution;
            return isSameLanguage && isSameResolution ? !Boolean(video.prepend(source)) : Boolean(source.remove());
        });
        if (currentSources.find((currentSource) => currentSource.src === video.currentSrc)) return;
        const currentTime = video.currentTime || 0;
        video.load();
        video.currentTime = currentTime;
    });
}
