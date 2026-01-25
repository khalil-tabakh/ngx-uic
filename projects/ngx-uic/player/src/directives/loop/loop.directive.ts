import { Directive, Renderer2, effect, inject, input, linkedSignal } from '@angular/core';

@Directive({
    selector: '[ngxLoop]',
    host: {
        '(click)': '$event.stopPropagation(); loop.set(!loop())',
        '(dblclick)': '$event.stopPropagation()'
    },
    exportAs: 'ngxLoop'
})
export class NgxLoopDirective {
    private renderer = inject(Renderer2);

    readonly audio = input<HTMLAudioElement>();
    readonly video = input<HTMLVideoElement>();

    readonly loop = linkedSignal({
        source: () => ({ audio: this.audio(), video: this.video() }),
        computation: ({ audio, video }) => video?.loop ?? audio?.loop ?? false
    });

    private loop$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.video() || this.audio();
        if (!media) return;
        const mutation$ = new MutationObserver(() => this.loop.set(media.loop));
        mutation$.observe(media, { attributeFilter: ['loop'] });
        onCleanup(() => mutation$.disconnect());
    });
    private toggle$ = effect((onCleanup) => {
        if (this.audio()) this.audio()!.loop = this.loop();
        if (this.video()) this.video()!.loop = this.loop();
        const media: HTMLMediaElement | undefined = this.video() || this.audio();
        if (!media || !this.loop()) return;
        if (this.audio()?.ended) this.audio()?.play().catch(() => {});
        if (this.video()?.ended) this.video()?.play().catch(() => {});
        const unlistenEnded = this.renderer.listen(media, 'ended', () => {
            this.audio()?.play().catch(() => {});
            this.video()?.play().catch(() => {});
        });
        onCleanup(() => unlistenEnded());
    });
}
