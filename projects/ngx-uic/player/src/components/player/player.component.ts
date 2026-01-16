import { CommonModule } from '@angular/common';
import { Component, DOCUMENT, ElementRef, Renderer2, computed, effect, inject, input } from '@angular/core';

@Component({
    selector: 'ngx-player',
    imports: [CommonModule],
    templateUrl: './player.component.html',
    styleUrl: './player.component.scss',
    host: {
        '(click)': 'media()?.paused ? media()?.play()?.catch() : media()?.pause()',
        '(dblclick)': 'document.fullscreenElement ? document.exitFullscreen() : element.requestFullscreen()'
    }
})
export class NgxPlayerComponent {
    protected document = inject(DOCUMENT);
    protected element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private renderer = inject(Renderer2);

    readonly audio = input<HTMLAudioElement>();
    readonly video = input<HTMLVideoElement>();

    protected media = computed(() => this.video() || this.audio());

    private sync$ = effect((onCleanup) => {
        const audio = this.audio();
        const video = this.video();
        if (!audio || !video) return;
        const unlistenPause = this.renderer.listen(video, 'pause', () => audio.pause());
        const unlistenPlaying = this.renderer.listen(video, 'playing', () => {
            audio.currentTime = video.currentTime;
            audio.play().catch();
        });
        const unlistenWaiting = this.renderer.listen(video, 'waiting', () => audio.pause());
        onCleanup(() => {
            unlistenPause();
            unlistenPlaying();
            unlistenWaiting();
        });
    });
}
