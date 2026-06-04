import { Directive, computed, effect, inject, input, linkedSignal, numberAttribute, resource, signal, untracked } from '@angular/core';
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

    readonly offset = input(0, { transform: numberAttribute });

    private tracks = computed(() => this.player.videoTracks().filter((track) => track.track.language));

    readonly captions = resource({
        defaultValue: [],
        params: () => ({ tracks: this.tracks(), video: this.player.video.value() }),
        stream: async ({ abortSignal, params }) => {
            const { tracks, video } = params;
            tracks.forEach((track) => track.track.mode = track.default ? 'showing' : 'disabled');
            const response = signal({ value: tracks.map((track) => track.track) as readonly TextTrack[] });
            video?.textTracks.addEventListener('change', () => response.set({ value: tracks.map((track) => track.track) }), { signal: abortSignal });
            return response;
        }
    }).asReadonly();
    
    readonly caption = linkedSignal<readonly TextTrack[], TextTrack | undefined>({
        source: this.captions.value,
        computation: (captions, previous) => {
            const newCaption = this.captions.value().find((caption) => caption.mode === 'showing');
            const oldCaption = captions.find((caption) => caption === previous?.value)
            return newCaption || oldCaption;
        }
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
        const caption = this.caption();
        if (!this.captions.isLoading()) untracked(() => {
            this.captions.value().forEach((caption) => caption.mode = 'disabled');
            if (caption) caption.mode = 'showing';
        });
    });
}
