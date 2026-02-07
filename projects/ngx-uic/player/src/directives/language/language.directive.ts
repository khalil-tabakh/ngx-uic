import { Directive, Renderer2, computed, effect, inject, input, linkedSignal } from '@angular/core';

@Directive({
    selector: '[ngxLanguage]',
    host: {
        '(click)': '$event.stopPropagation()',
        '(dblclick)': '$event.stopPropagation()'
    },
    exportAs: 'ngxLanguage'
})
export class NgxLanguageDirective {
    private renderer = inject(Renderer2);

    readonly audio = input<HTMLAudioElement>();
    readonly video = input<HTMLVideoElement>();

    private audioSources = linkedSignal(() => {
        const sources = Array.from(this.audio()?.getElementsByTagName('source') || []);
        return sources.filter((source) => source.lang).reverse();
    });
    private videoSources = linkedSignal(() => {
        const sources = Array.from(this.video()?.getElementsByTagName('source') || []);
        return sources.filter((source) => source.lang).reverse();
    });

    private audioLanguages = computed(() => this.audioSources().map((source) => source.lang));
    private videoLanguages = computed(() => this.videoSources().map((source) => source.lang));

    private audioLanguage = linkedSignal(() => this.audioLanguages().find((language) => language === this.audio()?.lang) || '');
    private videoLanguage = linkedSignal(() => this.videoLanguages().find((language) => language === this.video()?.lang) || '');

    readonly languages = computed(() => {
        const languages = this.audioLanguages().concat(this.videoLanguages());
        return new Set(languages).values().toArray().sort();
    });

    readonly language = linkedSignal(() => this.audioLanguage() || this.videoLanguage());

    private audioLanguage$ = effect((onCleanup) => {
        const audio = this.audio();
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
    private audioSources$ = effect((onCleanup) => {
        const oldSources = Array.from(this.audio()?.getElementsByTagName('source') || []);
        const unlistenErrors = oldSources.map((oldSource) => {
            return this.renderer.listen(oldSource, 'error', () => {
                oldSource.remove();
                if (this.audioSources().includes(oldSource))
                    this.audioSources.update((newSources) => newSources.filter((newSource) => newSource !== oldSource));
            });
        });
        onCleanup(() => unlistenErrors.forEach((unlistenError) => unlistenError()));
    });
    private videoLanguage$ = effect((onCleanup) => {
        const video = this.video();
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
    private videoSources$ = effect((onCleanup) => {
        const oldSources = Array.from(this.video()?.getElementsByTagName('source') || []);
        const unlistenErrors = oldSources.map((oldSource) => {
            return this.renderer.listen(oldSource, 'error', () => {
                oldSource.remove();
                if (this.videoSources().includes(oldSource))
                    this.videoSources.update((newSources) => newSources.filter((newSource) => newSource !== oldSource));
            });
        });
        onCleanup(() => unlistenErrors.forEach((unlistenError) => unlistenError()));
    });
    private switch$ = effect(() => {
        if (this.audio()) this.refreshSources(this.audio()!, this.audioSources(), this.language());
        const sources = Array.from(this.audio()?.getElementsByTagName('source') || []);
        const language = !sources.find((source) => source.lang === this.language()) ? this.language() : '';
        if (this.video()) this.refreshSources(this.video()!, this.videoSources(), language);
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
        if (media.getElementsByTagName('source').length && !paused) media.play().catch(() => {});
    }
}
