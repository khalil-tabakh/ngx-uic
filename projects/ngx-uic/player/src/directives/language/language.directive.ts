import { Directive, computed, effect, inject, linkedSignal, untracked } from '@angular/core';
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

    private audioSources = computed<readonly HTMLSourceElement[]>(() => this.player.audioSources().filter((source) => source.lang));
    private videoSources = computed<readonly HTMLSourceElement[]>(() => this.player.videoSources().filter((source) => source.lang));

    readonly languages = computed<readonly string[]>(() => {
        const sources = this.audioSources().concat(this.videoSources());
        const languages = sources.map((source) => source.lang);
        return new Set(languages).values().toArray();
    });

    readonly language = linkedSignal<readonly string[], string>({
        source: this.languages,
        computation: (languages, previous) => {
            const media: HTMLMediaElement | undefined = this.player.audio.value() || this.player.video.value();
            const newLanguage = languages.find((language) => language === media?.lang);
            const oldLanguage = languages.find((language) => language === previous?.value);
            return newLanguage || oldLanguage || languages.at(0) || '';
        }
    });

    private language$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.audio.value() || this.player.video.value();
        if (!media) return;
        const mutation$ = new MutationObserver(() => this.language.set(media.lang));
        mutation$.observe(media, { attributeFilter: ['lang'] });
        const onLoadedmetadata = () => this.language.set(this.player.audioSource()?.lang || this.player.videoSource()?.lang || '');
        media.addEventListener('loadedmetadata', onLoadedmetadata);
        onCleanup(() => {
            mutation$.disconnect();
            media.removeEventListener('loadedmetadata', onLoadedmetadata);
        });
    });
    private switch$ = effect(() => {
        const audioLanguage = this.language();
        const audio = this.player.audio.value();
        if (audio) this.reload(audioLanguage, audio, this.audioSources(), untracked(this.player.audioSource));
        const videoLanguage = !audio?.getElementsByTagName('source').length ? audioLanguage : '';
        const video = this.player.video.value();
        if (video) this.reload(videoLanguage, video, this.videoSources(), untracked(this.player.videoSource));
    });

    private reload(language: string, media: HTMLMediaElement, sources: readonly HTMLSourceElement[], source?: HTMLSourceElement): void {
        media.lang = language;
        const currentSources = sources.toReversed().filter((source) => {
            const isSameLanguage = !language || language === source.lang;
            return isSameLanguage ? !Boolean(media.prepend(source)) : Boolean(source.remove());
        });
        if (currentSources.some((currentSource) => currentSource.src === source?.src)) return;
        const currentTime = media.currentTime || 0;
        media.removeAttribute('src');
        media.load();
        if (currentSources.length) media.addEventListener('loadedmetadata', () => media.currentTime = currentTime, { once: true });
    }
}
