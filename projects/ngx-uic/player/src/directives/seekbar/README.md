# NgxSeekBarDirective

The `NgxSeekBarDirective` connects an `NgxRangeComponent` to media managed by `NgxPlayerComponent`, providing seeking, buffered range visualization, playback position tracking, and optional thumbnail generation.

It supports both audio and video playback, displays buffered media segments, and can generate preview thumbnails for standard video files, **HLS**, and **MPEG-DASH** streams.

## API

### Selectors

```ts
@Directive({
    selector: 'ngx-range[ngxSeekbar]',
    exportAs: 'ngxSeekbar'
})
```

### Inputs

| Name         | Type                                    | Description                                                 |
| ------------ | --------------------------------------- | ----------------------------------------------------------- |
| `regenerate` | `boolean`                               | Regenerates thumbnails when the active video source changes |
| `thumbnail`  | `readonly number[] \| number \| string` | Thumbnail timestamps or generation interval in seconds      |

### Properties

| Name          | Type                                                         | Description                  |
| ------------- | ------------------------------------------------------------ | ---------------------------- |
| `buffered`    | `Resource<ReadonlyMap<number, number>>`                      | Buffered media time ranges   |
| `currentTime` | `Resource<number>`                                           | Current playback position    |
| `duration`    | `Resource<number>`                                           | Media duration               |
| `thumbnails`  | `Resource<ReadonlyMap<number, string \| null \| undefined>>` | Generated thumbnail previews |

## Usage

### Basic Seek Bar

```html
<ngx-range
    ngxSeekbar
    step="0"
    [max]="ngxSeekbar.duration.value()"
    [value]="ngxSeekbar.currentTime.value()"
    #ngxSeekbar="ngxSeekbar"
/>
```

### Display Current Time

```html
<ngx-range
    ngxSeekbar
    step="0"
    [max]="ngxSeekbar.duration.value()"
    [value]="ngxSeekbar.currentTime.value()"
    #ngxSeekbar="ngxSeekbar"
/>
<span>{{ ngxSeekbar.currentTime.value() | ngxTime }}</span>
```

### Buffered Progress Indicator

```html
<ngx-range
    ngxSeekbar
    step="0"
    [max]="ngxSeekbar.duration.value()"
    [value]="ngxSeekbar.currentTime.value()"
    #ngxSeekbar="ngxSeekbar"
/>
<span>Buffered ranges: {{ seekbar.buffered.value().size }}</span>
```
```css
:host ::ng-deep ngx-range .segment {
    background-image: linear-gradient(to right, var(--buffered, transparent, transparent));
}
```

### Generate Thumbnails at Fixed Intervals

```html
<ngx-range
    ngxSeekbar
    step="0"
    [max]="ngxSeekbar.duration.value()"
    [value]="ngxSeekbar.currentTime.value()"
    [thumbnail]="10"
    #ngxSeekbar="ngxSeekbar"
/>
```

Generates thumbnails every 10 seconds.

### Generate Thumbnails at Specific Timestamps

```html
<ngx-range
    ngxSeekbar
    step="0"
    [max]="ngxSeekbar.duration.value()"
    [value]="ngxSeekbar.currentTime.value()"
    [thumbnail]="[0, 30, 60, 90]"
    #ngxSeekbar="ngxSeekbar"
/>
```

### Example

```html
@if (ngxRange.hover.value() >= 0) {
    <div class="preview" [style.--preview-left]="ngxRange.hover.value() / ngxSeekbar.duration.value() * 100">
        @if (thumbnails().findLast((thumbnail) => ngxRange.hover.value() >= thumbnail[0])?.at(-1); as src) {
            <img class="thumbnail" [src]="src" />
        }
        <div class="time">{{ ngxRange.hover.value() | ngxTime }}</div>
    </div>
}
<ngx-range
    ngxSeekbar
    step="0"
    [max]="ngxSeekbar.duration.value()"
    [value]="ngxSeekbar.currentTime.value()"
    [thumbnail]="15"
    #ngxRange
    #ngxSeekbar="ngxSeekbar"
/>
<button (click)="remainingTime.set(!remainingTime())">
    @if (remainingTime()) {
        {{ (ngxSeekbar.currentTime.value() - ngxSeekbar.duration.value()) | ngxTime }}/{{ ngxSeekbar.duration.value() | ngxTime }}
    } @else {
        {{ ngxSeekbar.currentTime.value() | ngxTime }}/{{ ngxSeekbar.duration.value() | ngxTime }}
    }
</button>
```

## Behavior

### Seeking

Moving the range control updates the media playback position immediately.

The directive automatically synchronizes:

* Audio playback position
* Video playback position
* Range component value

### Drag Behavior

When seeking begins:

* Playback is temporarily paused
* The seek position can be adjusted smoothly
* Playback resumes after pointer release if the media was previously playing

This helps prevent unnecessary buffering and decoding while dragging.

### Buffered Range Visualization

Buffered media ranges are automatically detected.

The directive continuously tracks:

* Progressive downloads
* Streaming buffer updates
* Playback progress

Buffered indicators are updated automatically as additional media data becomes available.

### Thumbnail Generation

Thumbnail previews can be generated from:

* Standard video files
* HLS streams (`.m3u8`)
* MPEG-DASH streams (`.mpd`)

Generated thumbnails are returned as object URLs and can be displayed directly in image elements.

### Thumbnail States

Each thumbnail entry can have one of three states:

| Value       | Meaning                             |
| ----------- | ----------------------------------- |
| `undefined` | Thumbnail generation is in progress |
| `string`    | Thumbnail successfully generated    |
| `null`      | Thumbnail generation failed         |

### Source Changes

When `regenerate` is enabled, thumbnails are regenerated whenever the active video source changes.

When disabled, thumbnails remain cached until the directive is recreated.

### Resource Cleanup

Generated thumbnail URLs are automatically released when:

* The directive is destroyed
* The media source changes
* Thumbnail resources are regenerated

This prevents unnecessary memory usage.

## Accessibility Notes

* Stops click and double-click propagation to avoid interfering with player controls
* Preserves playback state while seeking
* Supports adaptive streaming formats including HLS and MPEG-DASH
* Can be integrated with custom thumbnail preview interfaces
