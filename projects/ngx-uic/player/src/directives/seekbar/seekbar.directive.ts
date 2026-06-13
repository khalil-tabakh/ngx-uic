import { DOCUMENT, Directive, ElementRef, booleanAttribute, effect, inject, input, resource, signal, untracked } from '@angular/core';
import { NgxRangeComponent, between, percentage } from '@ngx-uic/range';
import { MediaPlayer } from 'dashjs';
import Hls from 'hls.js';
import { NgxPlayerComponent } from '../../components/player/player.component';

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

    readonly buffered = resource<ReadonlyMap<number, number>, HTMLMediaElement | undefined>({
        defaultValue: new Map<number, number>(),
        params: () => this.player.video() || this.player.audio(),
        stream: ({ abortSignal, params: media }) => {
            const response = signal({ value: new Map() });
            let timer$: ReturnType<typeof setTimeout>;
            const setBuffered = () => {
                clearTimeout(timer$);
                const buffered = new Map<number, number>();
                for (let i = 0; i < media.buffered.length; ++i) buffered.set(media.buffered.start(i), media.buffered.end(i));
                response.set({ value: buffered });
                // Force recheck every half remaining buffered time because "progress" event doesn't reliably trigger at the media end
                const closest = buffered.values().find((end) => end >= media.currentTime) || 0;
                if (closest > 0 && closest < media.duration) {
                    const timeout = Math.ceil((closest - media.currentTime) / 2) * 1000;
                    if (timeout > 0 && !media.paused) timer$ = setTimeout(() => setBuffered(), timeout);
                }
            }
            setBuffered();
            media.addEventListener('loadstart', () => response.set({ value: new Map<number, number>() }), { signal: abortSignal });
            media.addEventListener('progress', () => setBuffered(), { signal: abortSignal });
            media.addEventListener('playing', () => setBuffered(), { signal: abortSignal }); // Trigger after each pointerup event
            abortSignal.addEventListener('abort', () => clearTimeout(timer$), { once: true });
            return response;
        }
    }).asReadonly();
    readonly currentTime = resource<number, HTMLMediaElement | undefined>({
        defaultValue: 0,
        params: () => this.player.video() || this.player.audio(),
        stream: ({ abortSignal, params: media }) => {
            const response = signal({ value: media.currentTime || 0 });
            this.element.addEventListener('input', () => response.set({ value: this.range.value() }), { signal: abortSignal });
            media.addEventListener('timeupdate', () => response.set({ value: media.currentTime }), { signal: abortSignal });
            return response;
        }
    }).asReadonly();
    readonly duration = resource<number, HTMLMediaElement | undefined>({
        defaultValue: 0,
        params: () => this.player.video() || this.player.audio(),
        stream: ({ abortSignal, params: media }) => {
            const response = signal({ value: media.duration || 0 });
            media.addEventListener('durationchange', () => response.set({ value: media.duration }), { signal: abortSignal });
            return response;
        }
    }).asReadonly();

    readonly thumbnails = resource({
        defaultValue: new Map<number, string | null | undefined>(),
        params: () => ({
            duration: this.duration.value(),
            source: this.regenerate() ? this.player.videoSource() : untracked(this.player.videoSource),
            thumbnail: this.thumbnail(),
            video: this.player.video()
        }),
        stream: ({ abortSignal, params }) => {
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
                        video.crossOrigin = 'anonymous';
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

    private applyBuffered$ = effect(() => this.range.segments().entries().forEach(([segmentStart, segmentEnd], index) => {
        const gradient = this.buffered.value().entries()
            .filter(([bufferStart, bufferEnd]) => bufferStart < segmentEnd && bufferEnd > segmentStart)
            .flatMap(([bufferStart, bufferEnd]) => [
                percentage(Math.max(bufferStart, segmentStart), segmentStart, segmentEnd),
                percentage(Math.min(bufferEnd, segmentEnd), segmentStart, segmentEnd)
            ])
            .reduce((colors, stop, index) => {
                if (stop === 100) return colors;
                if (index % 2 === 0) colors.push(`transparent ${stop}%`);
                colors.push(`var(--buffered-color, rgba(255, 255, 255, 0.5)) ${stop}%`);
                if (index % 2 !== 0) colors.push(`transparent ${stop}%`);
                return colors;
            }, [] as string[])
            .join(', ');
        const segment = this.range.segmentRefs()[index].nativeElement;
        segment.style.setProperty('--buffered', `${gradient}`);
    }));

    protected onSeek(): void {
        const currentTime = this.range.value();
        if (this.player.audio()) this.player.audio()!.currentTime = currentTime;
        if (this.player.video()) this.player.video()!.currentTime = currentTime;
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
