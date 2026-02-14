import { Directive, Renderer2, computed, effect, inject, linkedSignal } from '@angular/core';
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
    private renderer = inject(Renderer2);

    private audioSources = computed(() => this.player.audioSources().filter((source) => source.lang).reverse());
    private videoSources = computed(() => this.player.videoSources().filter((source) => source.lang).reverse());

    private audioLanguages = computed(() => this.audioSources().reverse().map((source) => source.lang));
    private videoLanguages = computed(() => this.videoSources().reverse().map((source) => source.lang));

    private audioLanguage = linkedSignal(() => this.audioLanguages().find((language) => language === this.player.audio()?.lang) || '');
    private videoLanguage = linkedSignal(() => this.videoLanguages().find((language) => language === this.player.video()?.lang) || '');

    readonly languages = computed(() => {
        const languages = this.audioLanguages().concat(this.videoLanguages());
        return new Set(languages).values().toArray();
    });

    readonly language = linkedSignal(() => this.audioLanguage() || this.videoLanguage());

    private audioLanguage$ = effect((onCleanup) => {
        const audio = this.player.audio();
        if (!audio) return;
        const unlistenLoadstart = this.renderer.listen(audio, 'loadstart', () => {
            const source = this.audioSources().find((source) => source.src === audio.currentSrc);
            this.audioLanguage.set(source?.lang || '');
        });
        const mutation$ = new MutationObserver(() => this.audioLanguage.set(audio.lang));
        mutation$.observe(audio, { attributeFilter: ['lang'] });
        onCleanup(() => {
            unlistenLoadstart();
            mutation$.disconnect();
        });
    });
    private videoLanguage$ = effect((onCleanup) => {
        const video = this.player.video();
        if (!video) return;
        const unlistenLoadstart = this.renderer.listen(video, 'loadstart', () => {
            const source = this.videoSources().find((source) => source.src === video.currentSrc);
            this.videoLanguage.set(source?.lang || '');
        });
        const mutation$ = new MutationObserver(() => this.videoLanguage.set(video.lang));
        mutation$.observe(video, { attributeFilter: ['lang'] });
        onCleanup(() => {
            unlistenLoadstart();
            mutation$.disconnect();
        });
    });
    private switch$ = effect(() => {
        const audio = this.player.audio();
        if (audio) this.refreshSources(audio, this.audioSources(), this.language());
        const sources = Array.from(audio?.getElementsByTagName('source') || []);
        const language = !sources.find((source) => source.lang === this.language()) ? this.language() : '';
        const video = this.player.video();
        if (video) this.refreshSources(video, this.videoSources(), language);
    });

    private refreshSources(media: HTMLMediaElement, sources: HTMLSourceElement[], language: string): void {
        media.lang = language;
        const currentSources = sources.filter((source) => {
            const isSameLanguage = source.lang === language || !language;
            return isSameLanguage ? !Boolean(media.prepend(source)) : Boolean(source.remove());
        });
        if (currentSources.find((currentSource) => currentSource.src === media.currentSrc)) return;
        const currentTime = media.currentTime || 0;
        const paused = media.paused;
        media.load();
        media.currentTime = currentTime;
        if (media.currentSrc && !paused) media.play().catch(() => {});
    }
}
