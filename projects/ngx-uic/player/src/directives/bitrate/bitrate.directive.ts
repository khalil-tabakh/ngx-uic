import { DOCUMENT, Directive, Renderer2, effect, inject, linkedSignal, resource } from '@angular/core';
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
    private renderer = inject(Renderer2);

    private sources = resource({
        defaultValue: [],
        params: this.player.audioSources,
        loader: async ({ params: sources }) => {
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
        const audio = this.player.audio();
        const sources = this.sources.value().reverse().filter((source) => source.lang === audio?.lang || !audio?.lang);
        const bitrates = sources.map((source) => Number(source.dataset['bitrate']));
        return new Set(bitrates).values().toArray();
    });

    readonly bitrate = linkedSignal(() => {
        const audio = this.player.audio();
        const source = this.sources.value().find((source) => source.src === audio?.currentSrc);
        const bitrate = Number(source?.dataset['bitrate'] || audio?.dataset['bitrate'] || '');
        return this.bitrates().includes(bitrate) ? bitrate : 0;
    });

    private bitrate$ = effect((onCleanup) => {
        const audio = this.player.audio();
        if (!audio) return;
        const unlistenLoadstart = this.renderer.listen(audio, 'loadstart', () => {
            const source = this.sources.value().find((source) => source.src === audio.currentSrc);
            this.bitrate.set(Number(source?.dataset['bitrate'] || ''));
        });
        const mutation$ = new MutationObserver(() => this.bitrate.set(Number(audio.dataset['bitrate'] || '')));
        mutation$.observe(audio, { attributeFilter: ['data-bitrate'] });
        onCleanup(() => {
            unlistenLoadstart();
            mutation$.disconnect();
        });
    });
    private bitrates$ = effect((onCleanup) => {
        const audio = this.player.audio();
        if (!audio) return;
        const mutation$ = new MutationObserver(() => {
            const sources = this.sources.value().reverse().filter((source) => source.lang === audio.lang || !audio.lang);
            const bitrates = sources.map((source) => Number(source.dataset['bitrate']));
            this.bitrates.set(new Set(bitrates).values().toArray());
        });
        mutation$.observe(audio, { attributeFilter: ['lang'] });
        onCleanup(() => mutation$.disconnect());
    });
    private switch$ = effect(() => {
        const audio = this.player.audio();
        if (!audio) return;
        const bitrate = this.bitrate() ? String(this.bitrate()) : '';
        audio.dataset['bitrate'] = bitrate;
        const currentSources = this.sources.value().filter((source) => {
            const isSameLanguage = source.lang === audio.lang || !audio.lang;
            const isSameBitrate = source.dataset['bitrate'] === bitrate || !bitrate;
            return isSameLanguage && isSameBitrate ? !Boolean(audio.prepend(source)) : Boolean(source.remove());
        });
        if (currentSources.find((currentSource) => currentSource.src === audio.currentSrc)) return;
        const currentTime = audio.currentTime || 0;
        audio.load();
        audio.currentTime = currentTime;
    });
}
