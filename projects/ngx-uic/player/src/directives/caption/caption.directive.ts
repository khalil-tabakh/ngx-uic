import { Directive, Renderer2, effect, inject, input, linkedSignal } from '@angular/core';

@Directive({
    selector: '[ngxCaption]',
    host: {
        '(click)': '$event.stopPropagation()',
        '(dblclick)': '$event.stopPropagation()'
    },
    exportAs: 'ngxCaption'
})
export class NgxCaptionDirective {
    private renderer = inject(Renderer2);

    readonly video = input.required<HTMLVideoElement>();

    private tracks = linkedSignal(() => Array.from(this.video().getElementsByTagName('track')).filter((track) => track.srclang));

    readonly captions = linkedSignal({
        source: this.tracks,
        computation: (tracks) => {
            const captions = Array.from(this.video().textTracks).filter((subtitle) => subtitle.language);
            const caption = captions.find((caption) => caption.mode === 'showing');
            return caption ? captions : captions.map((caption, index) => {
                caption.mode = !tracks.at(index)?.default ? 'hidden' : 'showing';
                return caption;
            });
        }
    });

    readonly caption = linkedSignal(() => this.captions().find((subtitle) => subtitle.mode === 'showing') ?? null);

    private captions$ = effect((onCleanup) => {
        const unlistenChange = this.renderer.listen(this.video().textTracks, 'change', () => {
            const captions = Array.from(this.video().textTracks).filter((subtitle) => subtitle.language);
            this.captions.set(captions);
        });
        onCleanup(() => unlistenChange());
    });
    private switch$ = effect(() => {
        const captions = Array.from(this.video().textTracks);
        captions.forEach((caption) => caption.mode = caption === this.caption() ? 'showing' : 'hidden')
    });
    private tracks$ = effect((onCleanup) => {
        const unlistenErrors = this.tracks().map((oldTrack) => {
            return this.renderer.listen(oldTrack, 'error', () => {
                oldTrack.remove();
                if (this.tracks().includes(oldTrack))
                    this.tracks.update((newTracks) => newTracks.filter((newTrack) => newTrack !== oldTrack));
            });
        });
        onCleanup(() => unlistenErrors.forEach((unlistenError) => unlistenError()));
    });
}
