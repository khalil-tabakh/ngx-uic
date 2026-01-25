import { Directive, input } from '@angular/core';

@Directive({
    selector: '[ngxSeek]',
    host: { 
        '(click)': 'onSeek($event)',
        '(dblclick)': '$event.stopPropagation()'
    },
    exportAs: 'ngxSeek'
})
export class NgxSeekDirective {
    readonly audio = input<HTMLAudioElement>();
    readonly video = input<HTMLVideoElement>();
    readonly value = input.required<number>();

    protected onSeek(event: PointerEvent): void {
        event.stopPropagation();
        const duration = this.video()?.duration ?? this.audio()?.duration ?? 0
        const currentTime = this.video()?.currentTime ?? this.audio()?.currentTime ?? 0;
        const nextTime = Math.min(Math.max(currentTime + this.value(), 0), duration);
        if (this.audio()) this.audio()!.currentTime = nextTime;
        if (this.video()) this.video()!.currentTime = nextTime;
    }
}
