import { Directive, computed, effect, inject, input, linkedSignal } from '@angular/core';
import { NgxPlayerComponent } from '../../components/player/player.component';

@Directive({
    selector: '[ngxCaption]',
    host: {
        '(click)': '$event.stopPropagation()',
        '(dblclick)': '$event.stopPropagation()'
    },
    exportAs: 'ngxCaption'
})
export class NgxCaptionDirective {
    private player = inject(NgxPlayerComponent);

    readonly offset = input(0);

    private tracks = computed(() => this.player.videoTracks().filter((track) => track.srclang));

    readonly captions = linkedSignal({
        source: () => ({ tracks: this.tracks(), video: this.player.video() }),
        computation: ({ tracks, video }) => {
            const captions = Array.from(video?.textTracks || []).filter((subtitle) => subtitle.language);
            const caption = captions.find((caption) => caption.mode === 'showing');
            return caption ? captions : captions.map((caption, index) => {
                caption.mode = !tracks.at(index)?.default ? 'hidden' : 'showing';
                return caption;
            });
        }
    });

    readonly caption = linkedSignal(() => this.captions().find((subtitle) => subtitle.mode === 'showing') ?? null);

    private captions$ = effect((onCleanup) => {
        const video = this.player.video();
        if (!video) return;
        const onChange = () => this.captions.set(Array.from(video.textTracks).filter((subtitle) => subtitle.language));
        video.textTracks.addEventListener('change', onChange);
        onCleanup(() => video.textTracks.removeEventListener('change', onChange));
    });
    private shift$ = effect((onCleanup) => {
        const cues = Array.from(this.caption()?.cues || []);
        const offset = this.offset();
        cues.forEach((cue) => {
            cue.startTime += offset;
            cue.endTime += offset;
        });
        onCleanup(() => cues.forEach((cue) => {
            cue.startTime -= offset;
            cue.endTime -= offset;
        }));
    });
    private switch$ = effect(() => {
        const video = this.player.video();
        if (!video) return;
        const captions = Array.from(video.textTracks);
        captions.forEach((caption) => caption.mode = caption === this.caption() ? 'showing' : 'hidden');
    });
}
