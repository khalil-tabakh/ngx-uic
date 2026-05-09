import { Directive, ElementRef, afterRenderEffect, inject, input } from '@angular/core';
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
    private element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private player = inject(NgxPlayerComponent);

    readonly keys = input<string[]>([]);
    readonly value = input.required<number>();

    private toggle$ = afterRenderEffect({
        read: (onCleanup) => {
            const player = this.element.closest<HTMLElement>('ngx-player');
            const onKeydown = (event: KeyboardEvent) => this.keys().includes(event.code) && this.onSeek();
            player?.addEventListener('keydown', onKeydown);
            onCleanup(() => player?.removeEventListener('keydown', onKeydown));
        },
    });

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
