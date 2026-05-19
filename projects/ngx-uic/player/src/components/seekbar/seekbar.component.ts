import { Component, ViewContainerRef, afterRenderEffect, effect, inject, input, linkedSignal, signal, viewChild } from '@angular/core';
import { NgxPlayerComponent } from '../player/player.component';
import { NgxRangeComponent, percentage } from '../../../../range/public-api';

@Component({
    selector: 'ngx-seekbar',
    imports: [NgxRangeComponent],
    templateUrl: './seekbar.component.html',
    styleUrl: './seekbar.component.scss',
    host: {
        '(click)': '$event.stopPropagation()',
        '(dblclick)': '$event.stopPropagation()',
        '(pointerdown)': 'onSeeking()'
    }
})
export class NgxSeekBarComponent {
    private player = inject(NgxPlayerComponent);

    readonly marks = input<number[]>([]);
    readonly splits = input<number[]>([]);

    readonly rangeRef = viewChild.required(NgxRangeComponent, { read: ViewContainerRef });

    private timer$?: NodeJS.Timeout;

    readonly buffered = signal<[number, number][]>([]);

    readonly currentTime = linkedSignal(() => this.player.video()?.currentTime || this.player.audio()?.currentTime || 0);
    readonly duration = linkedSignal(() => this.player.video()?.duration || this.player.audio()?.duration || 0);

    private buffered$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const controller = new AbortController();
        media.addEventListener('loadstart', () => this.buffered.set([]), { signal: controller.signal });
        media.addEventListener('progress', () => this.setBuffered(), { signal: controller.signal });
        media.addEventListener('playing', () => this.setBuffered(), { signal: controller.signal }); // Trigger after each pointerup event
        onCleanup(() => controller.abort());
    });
    private currentTime$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const onTimeupdate = () => this.currentTime.set(media.currentTime);
        media.addEventListener('timeupdate', onTimeupdate);
        onCleanup(() => media.removeEventListener('timeupdate', onTimeupdate));
    });
    private duration$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const onDurationchange = () => this.duration.set(media.duration);
        media.addEventListener('durationchange', onDurationchange);
        onCleanup(() => media.removeEventListener('durationchange', onDurationchange));
    });

    private renderBuffered$ = afterRenderEffect({
        write: () => {
            const range = this.rangeRef().injector.get(NgxRangeComponent);
            range.segmentRefs().forEach((segmentRef, index) => {
                const { start, end } = range.segments()[index];
                const gradient = this.buffered()
                    .filter((buffer) => buffer[0] < end && buffer[1] > start)
                    .flatMap((buffer) => [
                        percentage(Math.max(buffer[0], start), start, end),
                        percentage(Math.min(buffer[1], end), start, end)
                    ])
                    .reduce((colors, stop, index) => {
                        if (stop === 100) return colors;
                        if (index % 2 === 0) colors.push(`transparent ${stop}%`);
                        colors.push(`var(--buffered-color) ${stop}%`);
                        if (index % 2 !== 0) colors.push(`transparent ${stop}%`);
                        return colors;
                    }, [] as string[])
                    .join(', ');
                const segment = segmentRef.nativeElement;
                segment.style.setProperty('--buffered', `${gradient}`);
            });
        }
    });

    private setBuffered(): void {
        clearTimeout(this.timer$);
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const buffered: [number, number][] = [];
        for (let i = 0; i < media.buffered.length; ++i) buffered.push([media.buffered.start(i), media.buffered.end(i)]);
        this.buffered.set(buffered);
        // Because "progress" event doesn't reliably trigger at the media end or on media reload
        const closest = buffered.find(([_, end]) => end >= media.currentTime)?.at(1) || 0;
        if (closest) { // Force recheck every half remaining buffered time
            const timeout = Math.ceil((closest - media.currentTime) / 2) * 1000;
            if (timeout > 0 && !media.paused) this.timer$ = setTimeout(() => this.setBuffered(), timeout);
        } else media.addEventListener('timeupdate', () => this.setBuffered(), { once: true }); // Force recheck on next media time update
    }

    protected onSeek(): void {
        const currentTime = this.rangeRef().injector.get(NgxRangeComponent).value();
        if (this.player.audio()) this.player.audio()!.currentTime = currentTime;
        if (this.player.video()) this.player.video()!.currentTime = currentTime;
        this.currentTime.set(currentTime);
    }

    protected onSeeking(): void {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const range = this.rangeRef().element.nativeElement as HTMLElement;
        const paused = media.paused;
        if (!!media.networkState) media.pause();
        range.addEventListener('pointerup', () => {
            if (!!media.networkState) paused ? media.pause() : media.play().catch(() => {});
        }, { once: true });
    }
}
