import { DOCUMENT, Directive, ElementRef, Signal, WritableSignal, afterRenderEffect, booleanAttribute, effect, inject, input, linkedSignal, resource, signal, untracked } from '@angular/core';
import { MediaPlayer } from 'dashjs';
import Hls from 'hls.js';
import { NgxPlayerComponent } from '../../components/player/player.component';
import { NgxRangeComponent, between, percentage } from '../../../../range/public-api';

@Directive({
    selector: 'ngx-range[ngxSeekbar]',
    host: {
        '(click)': '$event.stopPropagation()',
        '(dblclick)': '$event.stopPropagation()',
        '(input)': 'onSeek()',
        '(pointerdown)': 'onSeeking()'
    },
    exportAs: 'ngxSeekbar'
})
export class NgxSeekBarDirective {
    private document = inject(DOCUMENT);
    private element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private player = inject(NgxPlayerComponent);
    private range = inject(NgxRangeComponent);

    readonly regenerate = input(false, { transform: booleanAttribute });
    readonly thumbnail = input<readonly number[] | number | string>([]);

    private timer$?: ReturnType<typeof setTimeout>;

    readonly buffered = signal<[number, number][]>([]);

    readonly currentTime = linkedSignal(() => this.player.video()?.currentTime || this.player.audio()?.currentTime || 0) as Signal<number>;
    readonly duration = linkedSignal(() => this.player.video()?.duration || this.player.audio()?.duration || 0) as Signal<number>;

    readonly thumbnails = resource({
        defaultValue: new Map<number, string | null | undefined>(),
        params: () => ({
            duration: this.duration(),
            source: this.regenerate() ? this.player.videoSource() : untracked(this.player.videoSource),
            thumbnail: this.thumbnail(),
            video: this.player.video()
        }),
        stream: async ({ abortSignal, params }) => {
            const { duration, source, thumbnail, video } = params;
            const timestamps: readonly number[] = Array.isArray(thumbnail)
                ? new Set(thumbnail).values().toArray().toSorted((a, b) => a - b).filter((mark) => between(mark, 0, duration))
                : new Array(+thumbnail ? Math.floor(duration / +thumbnail) + 1 : 0).fill(0).map((_, index) => +thumbnail * index);
            const response = signal({ value: new Map() as ReadonlyMap<number, string | null | undefined> });
            response.set({ value: new Map(timestamps.map((timestamp) => [timestamp, source ? undefined : null])) });
            if (!duration || !source || !timestamps.length || !video) return response;
            const setImage = (video: HTMLVideoElement, timestamp: number) => {
                const canvas = new OffscreenCanvas(video.videoWidth, video.videoHeight);
                canvas.getContext('2d')?.drawImage(video, 0, 0);
                canvas.convertToBlob({ type: 'image/jpeg' })
                    .then((blob) => response.update(({ value }) => ({ value: new Map(value).set(timestamp, URL.createObjectURL(blob)) })))
                    .catch(() => response.update(({ value }) => ({ value: new Map(value).set(timestamp, null) })));
            };
            timestamps.forEach((timestamp) => {
                const video = this.document.createElement('video');
                switch (source.src.split('?')[0].split('.').at(-1)) {
                    case 'm3u8':
                        const hls = new Hls({ startLevel: 0, startPosition: timestamp });
                        hls.attachMedia(video);
                        hls.loadSource(source.src);
                        hls.on(Hls.Events.ERROR, (_, data) => {
                            if (!data.fatal) return;
                            response.update(({ value }) => ({ value: new Map(value).set(timestamp, null) }));
                            hls.destroy();
                        });
                        video.onloadedmetadata = () => video.currentTime = timestamp;
                        video.onseeked = () => {
                            setImage(video, timestamp);
                            hls.destroy();
                        };
                        break;
                    case 'mpd':
                        const dash = MediaPlayer().create();
                        dash.initialize(video, source.src, false, timestamp);
                        dash.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: false } } } });
                        dash.on('error', () => {
                            response.update(({ value }) => ({ value: new Map(value).set(timestamp, null) }));
                            dash.destroy();
                        });
                        video.onloadedmetadata = () => {
                            video.currentTime = timestamp;
                            dash.setRepresentationForTypeById('video', dash.getRepresentationsByType('video')[0].id, true);
                        };
                        video.onseeked = () => {
                            setImage(video, timestamp);
                            dash.destroy();
                        };
                        break;
                    default:
                        video.preload = 'metadata';
                        video.src = source.src;
                        video.onerror = () => {
                            response.update(({ value }) => ({ value: new Map(value).set(timestamp, null) }));
                            video.removeAttribute('src');
                            video.load();
                        };
                        video.onloadedmetadata = () => video.currentTime = timestamp;
                        video.onseeked = () => {
                            setImage(video, timestamp);
                            video.removeAttribute('src');
                            video.load();
                        };
                        break;
                }
            });
            abortSignal.addEventListener('abort', () => response().value.forEach((src) => src && URL.revokeObjectURL(src)), { once: true });
            return response;
        }
    }).asReadonly();

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
        const onTimeupdate = () => (this.currentTime as WritableSignal<number>).set(media.currentTime);
        media.addEventListener('timeupdate', onTimeupdate);
        onCleanup(() => media.removeEventListener('timeupdate', onTimeupdate));
    });
    private duration$ = effect((onCleanup) => {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const onDurationchange = () => (this.duration as WritableSignal<number>).set(media.duration);
        media.addEventListener('durationchange', onDurationchange);
        onCleanup(() => media.removeEventListener('durationchange', onDurationchange));
    });

    private renderBuffered$ = afterRenderEffect({
        write: () => this.range.segmentRefs().forEach((segmentRef, index) => {
            const { start, end } = this.range.segments()[index];
            const gradient = this.buffered()
                .filter((buffer) => buffer[0] < end && buffer[1] > start)
                .flatMap((buffer) => [
                    percentage(Math.max(buffer[0], start), start, end),
                    percentage(Math.min(buffer[1], end), start, end)
                ])
                .reduce((colors, stop, index) => {
                    if (stop === 100) return colors;
                    if (index % 2 === 0) colors.push(`transparent ${stop}%`);
                    colors.push(`var(--buffered-color, rgba(255, 255, 255, 0.5)) ${stop}%`);
                    if (index % 2 !== 0) colors.push(`transparent ${stop}%`);
                    return colors;
                }, [] as string[])
                .join(', ');
            const segment = segmentRef.nativeElement;
            segment.style.setProperty('--buffered', `${gradient}`);
        })
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
        const currentTime = this.range.value();
        if (this.player.audio()) this.player.audio()!.currentTime = currentTime;
        if (this.player.video()) this.player.video()!.currentTime = currentTime;
        (this.currentTime as WritableSignal<number>).set(currentTime);
    }

    protected onSeeking(): void {
        const media: HTMLMediaElement | undefined = this.player.video() || this.player.audio();
        if (!media) return;
        const paused = media.paused;
        if (!!media.networkState) media.pause();
        this.element.addEventListener('pointerup', () => {
            if (!!media.networkState) paused ? media.pause() : media.play().catch(() => {});
        }, { once: true });
    }
}
