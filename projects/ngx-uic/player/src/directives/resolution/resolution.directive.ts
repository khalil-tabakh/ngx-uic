import { DOCUMENT, Directive, Renderer2, effect, inject, input, linkedSignal, resource } from '@angular/core';

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
    private renderer = inject(Renderer2);

    readonly video = input.required<HTMLVideoElement>();

    private sources = resource({
        defaultValue: [],
        params: this.video,
        loader: async (request) => {
            const sources = Array.from(request.params.getElementsByTagName('source'));
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
        const sources = this.sources.value().reverse().filter((source) => source.lang === this.video().lang || !this.video().lang);
        const resolutions = sources.map((source) => Number(source.dataset['resolution']));
        return new Set(resolutions).values().toArray();
    });

    readonly resolution = linkedSignal(() => {
        const source = this.sources.value().find((source) => source.src === this.video().currentSrc);
        const resolution = Number(source?.dataset['resolution'] || this.video().dataset['resolution'] || '');
        return this.resolutions().includes(resolution) ? resolution : 0;
    });

    private resolution$ = effect((onCleanup) => {
        const unlistenLoadstart = this.renderer.listen(this.video(), 'loadstart', () => {
            const source = this.sources.value().find((source) => source.src === this.video().currentSrc);
            this.resolution.set(Number(source?.dataset['resolution'] || ''));
        });
        const mutation$ = new MutationObserver(() => this.resolution.set(Number(this.video().dataset['resolution'] || '')));
        mutation$.observe(this.video(), { attributeFilter: ['data-resolution'] });
        onCleanup(() => {
            unlistenLoadstart();
            mutation$.disconnect();
        });
    });
    private resolutions$ = effect((onCleanup) => {
        const mutation$ = new MutationObserver(() => {
            const sources = this.sources.value().reverse().filter((source) => source.lang === this.video().lang || !this.video().lang);
            const resolutions = sources.map((source) => Number(source.dataset['resolution']));
            this.resolutions.set(new Set(resolutions).values().toArray());
        });
        mutation$.observe(this.video(), { attributeFilter: ['lang'] });
        onCleanup(() => mutation$.disconnect());
    });
    private sources$ = effect((onCleanup) => {
        const oldSources = Array.from(this.video().getElementsByTagName('source'));
        const unlistenErrors = oldSources.map((oldSource) => {
            return this.renderer.listen(oldSource, 'error', () => {
                oldSource.remove();
                if (this.sources.value().includes(oldSource))
                    this.sources.update((newSources) => newSources.filter((newSource) => newSource !== oldSource));
            });
        });
        onCleanup(() => unlistenErrors.forEach((unlistenError) => unlistenError()));
    });
    private switch$ = effect(() => {
        const video = this.video();
        const resolution = this.resolution() ? String(this.resolution()) : '';
        video.dataset['resolution'] = resolution;
        const currentSources = this.sources.value().filter((source) => {
            const isSameLanguage = source.lang === video.lang || !video.lang;
            const isSameResolution = source.dataset['resolution'] === resolution || !resolution;
            return isSameLanguage && isSameResolution ? !Boolean(video.prepend(source)) : Boolean(source.remove());
        });
        if (currentSources.find((currentSource) => currentSource.src === video.currentSrc)) return;
        const currentTime = video.currentTime || 0;
        const paused = video.paused;
        video.load();
        video.currentTime = currentTime;
        if (video.currentSrc && !paused) video.play().catch(() => {});
    });
}
