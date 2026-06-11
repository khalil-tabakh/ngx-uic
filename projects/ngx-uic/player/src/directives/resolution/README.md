# NgxResolutionDirective

The `NgxResolutionDirective` provides resolution discovery and selection for video media managed by `NgxPlayerComponent`.

It automatically extracts available resolutions from video sources, supports adaptive streaming technologies such as **HLS** and **MPEG-DASH**, and allows switching between manual and automatic resolution selection modes.

## API

### Selectors

```ts
@Directive({
    selector: '[ngxResolution]',
    exportAs: 'ngxResolution'
})
```

### Properties

| Name          | Type                        | Description                                                  |
| ------------- | --------------------------- | ------------------------------------------------------------ |
| `auto`        | `WritableSignal<boolean>`   | Automatic resolution selection                               |
| `isAdaptive`  | `Signal<boolean>`           | Indicates whether adaptive resolution selection is available |
| `resolution`  | `WritableSignal<number>`    | Selected resolution                                          |
| `resolutions` | `Signal<readonly number[]>` | Available resolution values                                  |

## Usage

### Active Resolution

```html
<div ngxResolution #ngxResolution="ngxResolution">
    Current: {{ ngxResolution.resolution() }}p
</div>
```

### Adaptive Streaming Indicator

```html
<div ngxResolution #ngxResolution="ngxResolution">
    @if (ngxResolution.isAdaptive()) {
        <span>Adaptive resolution available</span>
    }
</div>
```

### Automatic Resolution Selection

```html
<div ngxResolution #ngxResolution="ngxResolution">
    <button (click)="ngxResolution.auto.set(true)">
        Auto
    </button>
</div>
```

### Manual Resolution Selection

```html
<div ngxResolution #ngxResolution="ngxResolution">
    @for (value of ngxResolution.resolutions(); track value) {
        <button
            (click)="ngxResolution.auto.set(false); ngxResolution.resolution.set(value)">
            {{ value }}p
        </button>
    }
</div>
```

### Example

```html
<ngx-player [video]="video">
    <video #video>
        <source src="video-480.mp4" />
        <source src="video-720.mp4" />
        <source src="video-1080.mp4" />
    </video>
    <div class="resolution" ngxResolution #ngxResolution="ngxResolution">
        <button popovertarget="resolution">
            <span class="material-icons md-light">high_quality</span>
        </button>
        <fieldset id="resolution" popover>
            @if (ngxResolution.isAdaptive()) {
                <label>
                    <input type="radio" name="resolution" [checked]="ngxResolution.auto()" (change)="ngxResolution.auto.set(true)" />
                    <span>Auto {{ ngxResolution.auto() && ngxResolution.resolution() ? `(${ngxResolution.resolution()}p)` : '' }}</span>
                </label>
            }
            @for (resolution of ngxResolution.resolutions(); track resolution) {
                <label>
                    <input
                        type="radio"
                        name="resolution"
                        [checked]="!ngxResolution.auto() && resolution === ngxResolution.resolution()"
                        (change)="ngxResolution.auto.set(false); ngxResolution.resolution.set(resolution)" />
                    <span>{{ resolution + 'p' }}</span>
                </label>
            }
        </fieldset>
    </div>
</ngx-player>
```

## Behavior

### Resolution Discovery

Available resolutions are automatically detected from:

* Standard video files using media metadata
* HLS manifests (`.m3u8`)
* MPEG-DASH manifests (`.mpd`)

Detected resolutions are cached on the corresponding source element using the `data-resolution` attribute.

### Adaptive Streaming

For HLS and MPEG-DASH sources, adaptive resolutions are extracted from available quality levels or representations.

When automatic mode is enabled:

* HLS uses the player's automatic level selection
* MPEG-DASH uses automatic bitrate adaptation
* The currently active resolution is updated as the streaming engine switches quality levels

### Source Filtering

Only sources matching the selected resolution remain active.

When automatic mode is enabled, adaptive sources are prioritized and manual resolution filtering is disabled.

### Language Filtering

When video sources define a `lang` attribute, only sources matching the currently selected language are considered for resolution selection.

### Source Fallback

Invalid sources are automatically removed when:

* Manifest loading fails
* Media metadata cannot be loaded
* Network requests fail

The player will continue using remaining valid sources when available.

### Playback Preservation

When switching between non-adaptive sources, the current playback position is preserved whenever possible.

## Accessibility Notes

* Stops click and double-click propagation to avoid interfering with player controls
* Can be used with native buttons, menus, and custom UI controls
* Updates automatically when adaptive streaming quality changes occur
* Works with standard video files, HLS streams, and MPEG-DASH streams
