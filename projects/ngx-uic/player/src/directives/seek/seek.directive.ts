import { Directive, inject, input } from '@angular/core';
import { NgxPlayerComponent } from '../../components/player/player.component';

@Directive({
    selector: '[ngxSeek]',
    host: { 
        '(click)': '$event.stopPropagation(); onSeek()',
        '(dblclick)': '$event.stopPropagation()'
    },
    exportAs: 'ngxSeek'
})
export class NgxSeekDirective {
    private player = inject(NgxPlayerComponent);

    readonly value = input.required<number>();

    protected onSeek(): void {
        const audio = this.player.audio();
        const video = this.player.video();
        const duration = video?.duration ?? audio?.duration ?? 0
        const oldTime = video?.currentTime ?? audio?.currentTime ?? 0;
        const newTime = Math.min(Math.max(oldTime + this.value(), 0), duration);
        if (audio) audio.currentTime = newTime;
        if (video) video.currentTime = newTime;
    }
}
