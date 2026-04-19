import { DOCUMENT, Directive, computed, effect, inject, linkedSignal, resource } from '@angular/core';
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
            return results.reduce((sources, result) => {
                if (result.status === 'fulfilled') sources.push(result.value);
                else result.reason.dispatchEvent(new Event('error'));
                return sources;
            }, [] as HTMLSourceElement[]);
        }
    }).asReadonly();

    readonly bitrates = computed(() => {
        const sources = this.sources.value();
        const bitrates = sources.map((source) => Number(source.dataset['bitrate'] || ''));
        return new Set(bitrates).values().toArray();
    });

    readonly bitrate = linkedSignal(() => {
        const audio = this.player.audio();
        const bitrate = this.bitrates().find((bitrate) => bitrate === Number(audio?.dataset['bitrate']));
        return bitrate || this.bitrates().at(0) || 0;
    });

    private bitrate$ = effect((onCleanup) => {
        const audio = this.player.audio();
        if (!audio) return;
        const mutation$ = new MutationObserver(() => this.bitrate.set(Number(audio.dataset['bitrate'] || '')));
        mutation$.observe(audio, { attributeFilter: ['data-bitrate'] });
        const onLoadstart = () => {
            const source = this.sources.value().find((source) => source.src === audio.currentSrc);
            this.bitrate.set(Number(source?.dataset['bitrate'] || ''));
        };
        audio.addEventListener('loadstart', onLoadstart);
        onCleanup(() => {
            mutation$.disconnect();
            audio.removeEventListener('loadstart', onLoadstart);
        });
    });
    private switch$ = effect(() => {
        if (this.sources.isLoading()) return;
        const bitrate = this.bitrate() ? String(this.bitrate()) : '';
        const audio = this.player.audio();
        if (audio) this.reload(bitrate, audio, this.sources.value());
    });

    private reload(bitrate: string, media: HTMLMediaElement, sources: HTMLSourceElement[]): void {
        media.dataset['bitrate'] = bitrate;
        const currentSources = sources.toReversed().filter((source) => {
            const isSameBitrate = !bitrate || source.dataset['bitrate']?.split(',').includes(bitrate);
            return isSameBitrate ? !Boolean(media.prepend(source)) : Boolean(source.remove());
        });
        if (currentSources.find((currentSource) => currentSource.src === media.currentSrc)) return;
        const currentTime = media.currentTime || 0;
        media.load();
        media.currentTime = currentTime;
    }
}
