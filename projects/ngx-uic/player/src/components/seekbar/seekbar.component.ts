import { Component, ElementRef, Renderer2, RendererStyleFlags2, afterRenderEffect, effect, inject, input, linkedSignal, signal, viewChild } from '@angular/core';
import { NgxPlayerComponent } from '../player/player.component';
import { NgxRangeComponent, between } from '../../../../range/public-api';

@Component({
    selector: 'ngx-seekbar',
    imports: [NgxRangeComponent],
    templateUrl: './seekbar.component.html',
    styleUrl: './seekbar.component.scss',
    host: {
        '(click)': '$event.stopPropagation()',
        '(dblclick)': '$event.stopPropagation()',
        '(pointerenter)': 'onHovering()',
        '(pointerdown)': 'onSeeking()'
    }
})
export class NgxSeekBarComponent {
    private player = inject(NgxPlayerComponent);
    private renderer = inject(Renderer2);

    readonly marks = input<number[]>([]);
    readonly splits = input<number[]>([]);

    readonly range = viewChild.required(NgxRangeComponent);
    readonly rangeRef = viewChild.required<NgxRangeComponent, ElementRef<HTMLElement>>(NgxRangeComponent, { read: ElementRef });

    private timer$?: NodeJS.Timeout;

    readonly buffered = signal<[number, number][]>([]);
    readonly hovered = signal(0);

    readonly currentTime = linkedSignal(() => this.player.video()?.currentTime || this.player.audio()?.currentTime || 0);
    readonly duration = linkedSignal(() => this.player.video()?.duration || this.player.audio()?.duration || 0);

    private buffered$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const unlistenLoadstart = this.renderer.listen(media, 'loadstart', () => this.buffered.set([]));
        const unlistenProgress = this.renderer.listen(media, 'progress', () => this.setBuffered());
        const unlistenPlaying = this.renderer.listen(media, 'playing', () => this.setBuffered()); // Trigger after each pointerup event
        onCleanup(() => {
            unlistenLoadstart();
            unlistenProgress();
            unlistenPlaying();
        });
    });
    private currentTime$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const unlistenTimeupdate = this.renderer.listen(media, 'timeupdate', () => this.currentTime.set(media.currentTime));
        onCleanup(() => unlistenTimeupdate());
    });
    private duration$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const unlistenDurationchange = this.renderer.listen(media, 'durationchange', () => this.duration.set(media.duration));
        onCleanup(() => unlistenDurationchange());
    });

    private applyBuffered$ = afterRenderEffect({
        write: () => {
            const buffered = this.buffered();
            const directives = this.range().segments();
            const elementRefs = this.range().segmentRefs();
            directives.forEach((directive, index) => {
                const segment = directive.segment();
                const segments = buffered.filter(([start, end]) => start < segment.end && end > segment.start);
                const length = segment.end - segment.start;
                const percentages = segments.reduce((percentages, [start, end]) => {
                    percentages.push((Math.max(start, segment.start) - segment.start) / length * 100);
                    percentages.push((Math.min(end, segment.end) - segment.start) / length * 100);
                    return percentages;
                }, [] as number[]);
                const gradient = percentages.reduce((colors, percentage, index) => {
                    if (percentage === 100) return colors;
                    if (index % 2 === 0) colors.push(`transparent ${percentage}%`);
                    colors.push(`var(--buffered-color) ${percentage}%`);
                    if (index % 2 !== 0) colors.push(`transparent ${percentage}%`);
                    return colors;
                }, [] as string[]).join(', ');
                this.renderer.setStyle(elementRefs[index].nativeElement, '--buffered', gradient, RendererStyleFlags2.DashCase);
            });
        }
    });
    private applyHovered$ = afterRenderEffect({
        write: () => {
            const hovered = this.hovered();
            const directives = this.range().segments();
            const elementRefs = this.range().segmentRefs();
            directives.forEach((directive, index) => {
                const segment = directive.segment();
                const percentage = Math.min(Math.max((hovered - segment.start) / (segment.end - segment.start) * 100, 0), 100);
                const element = elementRefs[index].nativeElement;
                this.renderer.setStyle(element, '--hovered', percentage, RendererStyleFlags2.DashCase);
                const start = segment.start;
                const end = directives.at(index + 1)?.segment().start ?? this.duration();
                if (between(hovered, start, end)) this.renderer.addClass(element, 'segment--hovered');
                else this.renderer.removeClass(element, 'segment--hovered');
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
        if (closest) {
            // Force recheck every half remaining buffered time
            const timeout = Math.ceil((closest - media.currentTime) / 2) * 1000;
            if (timeout > 0 && !media.paused) this.timer$ = setTimeout(() => this.setBuffered(), timeout);
        } else {
            // Force recheck the next time the media time update
            const unlistenTimeupdate = this.renderer.listen(media, 'timeupdate', () => {
                unlistenTimeupdate();
                this.setBuffered();
            });
        }
    }

    protected onHovering(): void {
        const range = this.rangeRef().nativeElement;
        const rangeStyle = getComputedStyle(range);
        const rangePaddingLeft = parseFloat(rangeStyle.paddingLeft);
        const rangePaddingRight = parseFloat(rangeStyle.paddingRight);
        const rangeLeft = range.getBoundingClientRect().left
        const rangeWidth = range.clientWidth - (rangePaddingLeft + rangePaddingRight);

        const onPointerMove = this.renderer.listen(range, 'pointermove', (event: PointerEvent) => {
            const offsetX = event.clientX - rangeLeft;
            let percentage = ((offsetX - rangePaddingLeft) / rangeWidth) * 100;
            if (percentage < 0) percentage = 0;
            if (percentage > 100) percentage = 100;
            this.hovered.set(this.duration() * percentage / 100);
        });
        const onPointerLeave = this.renderer.listen(range, 'pointerleave', () => {
            this.hovered.set(-1);
            onPointerMove();
            onPointerLeave();
        });
    }

    protected onSeek(value: number): void {
        if (this.player.audio()) this.player.audio()!.currentTime = value;
        if (this.player.video()) this.player.video()!.currentTime = value;
        this.currentTime.set(value);
    }

    protected onSeeking(): void {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const range = this.rangeRef().nativeElement;
        const paused = media.paused;
        if (media.currentSrc) media.pause();
        const unlistenPointerup = this.renderer.listen(range, 'pointerup', () => {
            if (media.currentSrc) paused ? media.pause() : media.play().catch(() => {});
            unlistenPointerup();
        });
    }
}
