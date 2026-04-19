import { Directive, computed, effect, inject, linkedSignal } from '@angular/core';
import { NgxPlayerComponent } from '../../components/player/player.component';

@Directive({
    selector: '[ngxLanguage]',
    host: {
        '(click)': '$event.stopPropagation()',
        '(dblclick)': '$event.stopPropagation()'
    },
    exportAs: 'ngxLanguage'
})
export class NgxLanguageDirective {
    private player = inject(NgxPlayerComponent);

    private audioSources = computed(() => this.player.audioSources().filter((source) => source.lang));
    private videoSources = computed(() => this.player.videoSources().filter((source) => source.lang));

    readonly languages = computed(() => {
        const sources = this.audioSources().concat(this.videoSources());
        const languages = sources.map((source) => source.lang);
        return new Set(languages).values().toArray();
    });

    readonly language = linkedSignal(() => {
        const media: HTMLMediaElement | undefined = this.player.audio() || this.player.video();
        const language = this.languages().find((language) => language === media?.lang);
        return language || this.languages().at(0) || '';
    });

    private language$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.audio() || this.player.video();
        if (!media) return;
        const mutation$ = new MutationObserver(() => this.language.set(media?.lang || ''));
        mutation$.observe(media, { attributeFilter: ['lang'] });
        const onLoadstart = () => {
            const source = this.audioSources().concat(this.videoSources()).find((source) => source.src === media.currentSrc);
            this.language.set(source?.lang || '');
        };
        media.addEventListener('loadstart', onLoadstart);
        onCleanup(() => {
            mutation$.disconnect();
            media.removeEventListener('loadstart', onLoadstart);
        });
    });
    private switch$ = effect(() => {
        const audioLanguage = this.language();
        const audio = this.player.audio();
        if (audio) this.reload(audioLanguage, audio, this.audioSources());
        const sources = Array.from(audio?.getElementsByTagName('source') || []);
        const videoLanguage = !sources.find((source) => source.lang === audioLanguage) ? audioLanguage : '';
        const video = this.player.video();
        if (video) this.reload(videoLanguage, video, this.videoSources());
    });

    private reload(language: string, media: HTMLMediaElement, sources: HTMLSourceElement[]): void {
        media.lang = language;
        const currentSources = sources.toReversed().filter((source) => {
            const isSameLanguage = !language || language === source.lang;
            return isSameLanguage ? !Boolean(media.prepend(source)) : Boolean(source.remove());
        });
        if (currentSources.find((currentSource) => currentSource.src === media.currentSrc)) return;
        const currentTime = media.currentTime || 0;
        media.load();
        media.currentTime = currentTime;
    }
}
