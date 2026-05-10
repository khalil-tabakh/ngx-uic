import { DOCUMENT, Directive, ResourceSnapshot, computed, effect, inject, linkedSignal, resource, untracked } from '@angular/core';
import { MediaPlayer, MediaPlayerClass, Representation } from 'dashjs';
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

    private language = computed(() => this.player.audioSource()?.lang || this.player.audio()?.lang);

    private sources = resource({
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
                    case 'mpd':
                        const dash = MediaPlayer().create();
                        dash.initialize(audio, source.src);
                        dash.on('error', () => {
                            dash.destroy();
                            return reject(source);
                        });
                        dash.on('streamInitialized', () => {
                            const representations = dash.getRepresentationsByType('audio');
                            const bitrates = representations.map((representation) => this.getBitrate(dash, representation));
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
                            const kbps = this.toBitrate(bytes * 8 / 1024, audio.duration);
                            source.dataset['bitrate'] = String(kbps);
                            return kbps ? resolve(source) : reject(source);
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

    readonly isAutomatable = linkedSignal<ResourceSnapshot<HTMLSourceElement[]>, boolean>({
        source: this.sources.snapshot,
        computation: (sources, previous) => sources.status == 'resolved'
            ? sources.value.some((source) => source.dataset['bitrate']!.split(',').length > 1)
            : previous?.value || false
    }).asReadonly();
    readonly bitrates = linkedSignal<ResourceSnapshot<HTMLSourceElement[]>, number[]>({
        source: this.sources.snapshot,
        computation: (sources, previous) => sources.status == 'resolved'
            ? new Set(sources.value.flatMap((source) => source.dataset['bitrates']!.split(',').map(Number))).values().toArray()
            : previous?.value || []
    }).asReadonly();

    readonly bitrate = linkedSignal<number[], number>({
        source: this.bitrates,
        computation: (bitrates, previous) => {
            const audio = this.player.audio();
            const newBitrate = bitrates.find((bitrate) => bitrate === Number(audio?.dataset['bitrate']));
            const oldBitrate = bitrates.find((bitrate) => bitrate === previous?.value);
            return newBitrate || oldBitrate || bitrates.at(0) || 0;
        }
    });

    readonly auto = linkedSignal<HTMLSourceElement | undefined, boolean>({
        source: this.player.audioSource,
        computation: (source, previous) => !previous?.source
            ? ['mpd'].includes(source?.src.split('?')[0].split('.').at(-1)!)
            : source
                ? previous?.value || !source.dataset['bitrate']?.split(',').map(Number).includes(this.bitrate())
                : previous?.value || false
    });

    private auto$ = effect((onCleanup) => {
        const dash = this.player.audioDash();
        if (!dash) return;
        const onDynamicToStatic = () => this.auto.set(dash.getSettings().streaming?.abr?.autoSwitchBitrate?.audio ?? true);
        dash.on('dynamicToStatic', onDynamicToStatic);
        onCleanup(() => dash.off('dynamicToStatic', onDynamicToStatic));
    });
    private bitrate$ = effect((onCleanup) => {
        const audio = this.player.audio();
        if (!audio) return;
        const mutation$ = new MutationObserver(() => this.bitrate.set(Number(audio.dataset['bitrate'] || '')));
        mutation$.observe(audio, { attributeFilter: ['data-bitrate'] });
        const onLoadedmetadata = () => {
            const source = this.player.audioSource();
            if (!source?.dataset['bitrate']) this.bitrate.set(0);
            else if (source.dataset['bitrate'].split(',').length < 2) this.bitrate.set(Number(source.dataset['bitrate']));
            else if (this.auto()) this.bitrate.set(this.getBitrate(dash));
            else { /** Force retrigger the {@link switch$} effect */
                const bitrate = this.bitrate();
                this.bitrate.set(0);
                this.bitrate.set(bitrate);
            }
        };
        audio.addEventListener('loadedmetadata', onLoadedmetadata);
        const dash = this.player.audioDash();
        const onQualityChangeRequested = () => this.bitrate.set(this.getBitrate(dash));
        dash?.on('qualityChangeRequested', onQualityChangeRequested);
        onCleanup(() => {
            mutation$.disconnect();
            audio.removeEventListener('loadedmetadata', onLoadedmetadata);
            dash?.off('qualityChangeRequested', onQualityChangeRequested);
        });
    });
    private switch$ = effect(() => {
        if (this.sources.isLoading()) return;
        const bitrate = this.bitrate() ? String(this.bitrate()) : '';
        const audio = this.player.audio();
        if (audio) this.reload(bitrate, audio, this.sources.value(), untracked(this.player.audioDash));
    });
    private toggle$ = effect(() => {
        const auto = this.auto();
        const dash = this.player.audioDash();
        dash?.updateSettings({ streaming: { abr: { autoSwitchBitrate: { audio: auto } } } });
    });

    private reload(bitrate: string, media: HTMLMediaElement, sources: HTMLSourceElement[], dash?: MediaPlayerClass): void {
        media.dataset['bitrate'] = bitrate;
        const currentSources = sources.toReversed().filter((source) => {
            const isSameBitrate = this.isAutomatable() && this.auto()
                ? source.dataset['bitrate']!.split(',').length > 1
                : !bitrate || source.dataset['bitrate']?.split(',').includes(bitrate);
            return isSameBitrate ? !Boolean(media.prepend(source)) : Boolean(source.remove());
        });
        switch (true) {
            case currentSources.some((currentSource) => currentSource.src === dash?.getSource()):
                const representations = dash!.getRepresentationsByType('audio');
                const representation = representations?.find((representation) => this.getBitrate(dash, representation) === Number(bitrate));
                if (representation) dash!.setRepresentationForTypeById('audio', representation.id, true);
                break;
            case currentSources.every((currentSource) => currentSource.src !== media.currentSrc) && media instanceof HTMLAudioElement:
                const currentTime = media.currentTime || 0;
                media.removeAttribute('src');
                media.load();
                if (currentSources.length) media.addEventListener('loadedmetadata', () => media.currentTime = currentTime, { once: true });
                break;
        }
    }

    private getBitrate(dash?: MediaPlayerClass, representation?: Representation): number {
        representation ||= dash?.getCurrentRepresentationForType('audio') ?? undefined;
        return dash && representation ? this.toBitrate(representation.bitrateInKbit * dash.duration(), dash.duration()) : this.bitrate();
    }

    private toBitrate(kbits: number, duration: number): number {
        return Math.round(Math.round((kbits) / duration) / 16) * 16;
    }
}
