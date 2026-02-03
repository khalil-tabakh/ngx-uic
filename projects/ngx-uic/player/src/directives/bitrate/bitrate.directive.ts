import { DOCUMENT, Directive, Renderer2, effect, inject, input, linkedSignal, resource } from '@angular/core';

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
    private renderer = inject(Renderer2);

    readonly audio = input.required<HTMLAudioElement>();

    private sources = resource({
        defaultValue: [],
        params: this.audio,
        loader: async (request) => {
            const sources = Array.from(request.params.getElementsByTagName('source'));
            const promises = sources.map((source) => new Promise<HTMLSourceElement>((resolve, reject) => {
                if (Number(source.dataset['bitrate'])) return resolve(source);
                const audio = this.document.createElement('audio');
                audio.preload = 'metadata';
                audio.src = source.src;
                audio.onerror = () => reject(source);
                audio.onloadedmetadata = () => fetch(source.src, { method: 'HEAD' }).then((response) => {
                    if (!response.ok) return reject(source);
                    const bytes = Number(response.headers.get('content-length')) || 0;
                    const kbps = Math.round(Math.round((bytes * 8 / 1024) / audio.duration) / 16) * 16;
                    source.dataset['bitrate'] = String(kbps);
                    return kbps ? resolve(source) : reject(source);
                });
            }));
            const results = await Promise.allSettled(promises);
            return results.filter((result) => result.status === 'fulfilled').map((result) => result.value).reverse();
        }
    });

    readonly bitrates = linkedSignal(() => {
        const sources = this.sources.value().filter((source) => source.lang === this.audio().lang || !this.audio().lang);
        const bitrates = sources.map((source) => Number(source.dataset['bitrate']));
        return new Set(bitrates).values().toArray().sort((a, b) => b - a);
    });

    readonly bitrate = linkedSignal(() => {
        const bitrate = Number(this.audio().dataset['bitrate'] || '');
        return this.bitrates().includes(bitrate) ? bitrate : 0;
    });

    private bitrate$ = effect((onCleanup) => {
        const unlistenLoadstart = this.renderer.listen(this.audio(), 'loadstart', () => {
            const bitrate = this.sources.value().find((source) => source.src === this.audio().currentSrc)?.dataset['bitrate'] || '';
            this.bitrate.set(Number(bitrate));
        });
        const mutation$ = new MutationObserver(() => this.bitrate.set(Number(this.audio().dataset['bitrate'] || '')));
        mutation$.observe(this.audio(), { attributeFilter: ['data-bitrate'] });
        onCleanup(() => {
            unlistenLoadstart();
            mutation$.disconnect();
        });
    });
    private bitrates$ = effect((onCleanup) => {
        const mutation$ = new MutationObserver(() => {
            const sources = this.sources.value().filter((source) => source.lang === this.audio().lang || !this.audio().lang);
            const bitrates = sources.map((source) => Number(source.dataset['bitrate']));
            this.bitrates.set(new Set(bitrates).values().toArray().sort((a, b) => b - a));
        });
        mutation$.observe(this.audio(), { attributeFilter: ['lang'] });
        onCleanup(() => mutation$.disconnect());
    });
    private sources$ = effect((onCleanup) => {
        const oldSources = Array.from(this.audio().getElementsByTagName('source'));
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
        const audio = this.audio();
        const bitrate = this.bitrate() ? String(this.bitrate()) : '';
        audio.dataset['bitrate'] = bitrate;
        const currentSources = this.sources.value().filter((source) => {
            const isSameLanguage = source.lang === audio.lang || !audio.lang;
            const isSameBitrate = source.dataset['bitrate'] === bitrate || !bitrate;
            return isSameLanguage && isSameBitrate ? !Boolean(audio.prepend(source)) : Boolean(source.remove());
        });
        if (currentSources.find((currentSource) => currentSource.src === audio.currentSrc)) return;
        const currentTime = audio.currentTime || 0;
        const paused = audio.paused;
        audio.load();
        audio.currentTime = currentTime;
        if (audio.getElementsByTagName('source').length && !paused) audio.play().catch(() => {});
    });
}
