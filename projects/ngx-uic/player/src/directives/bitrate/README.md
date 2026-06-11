# NgxBitrateDirective

The `NgxBitrateDirective` provides bitrate discovery and selection for media managed by `NgxPlayerComponent`.

It automatically extracts available bitrates from audio and video sources, supports adaptive streaming technologies such as **HLS** and **MPEG-DASH**, and allows switching between manual and automatic bitrate selection modes.

## API

### Selectors

```ts
@Directive({
    selector: '[ngxBitrate]',
    exportAs: 'ngxBitrate'
})
```

### Properties

| Name            | Type                        | Description                                               |
| --------------- | --------------------------- | --------------------------------------------------------- |
| `auto`          | `WritableSignal<boolean>`   | Automatic bitrate selection                               |
| `bitrate`       | `WritableSignal<number>`    | Selected bitrate                                          |
| `bitrates`      | `Signal<readonly number[]>` | Available bitrate values                                  |
| `isAdaptive`    | `Signal<boolean>`           | Indicates whether adaptive bitrate selection is available |

## Usage

### Active Bitrate

```html
<div ngxBitrate #ngxBitrate="ngxBitrate">
    Current: {{ ngxBitrate.bitrate() }} kbps
</div>
```

### Adaptive Streaming Indicator

```html
<div ngxBitrate #ngxBitrate="ngxBitrate">
    @if (ngxBitrate.isAdaptive()) {
        <span>Adaptive bitrate available</span>
    }
</div>
```

### Automatic Bitrate Selection

```html
<div ngxBitrate #ngxBitrate="ngxBitrate">
    <button (click)="ngxBitrate.auto.set(true)">
        Auto
    </button>
</div>
```

### Manual Bitrate Selection

```html
<div ngxBitrate #ngxBitrate="ngxBitrate">
    @for (value of bitrate.bitrates(); track value) {
        <button
            (click)="ngxBitrate.auto.set(false); ngxBitrate.bitrate.set(value)">
            {{ value }} kbps
        </button>
    }
</div>
```

### Example

```html
<ngx-player [audio]="audio">
    <audio #audio>
        <source src="audio-128.mp3" />
        <source src="audio-256.mp3" />
        <source src="audio-320.mp3" />
    </audio>
    <div class="bitrate" ngxBitrate #ngxBitrate="ngxBitrate">
        <button popovertarget="bitrate">
            <span class="material-icons md-light">graphic_eq</span>
        </button>
        <fieldset id="bitrate" popover>
            @if (bitrate.isAdaptive()) {
                <label>
                    <input type="radio" name="bitrate" [checked]="ngxBitrate.auto()" (change)="ngxBitrate.auto.set(true)" />
                    <span>Auto {{ ngxBitrate.auto() && ngxBitrate.bitrate() ? `(${ngxBitrate.bitrate()} kbps)` : '' }}</span>
                </label>
            }
            @for (bitrate of ngxBitrate.bitrates(); track bitrate) {
                <label>
                    <input
                        type="radio"
                        name="bitrate"
                        [checked]="!ngxBitrate.auto() && bitrate === ngxBitrate.bitrate()"
                        (change)="ngxBitrate.auto.set(false); ngxBitrate.bitrate.set(bitrate)"
                    />
                    <span>{{ bitrate + ' kbps' }}</span>
                </label>
            }
        </fieldset>
    </div>
</ngx-player>
```

## Behavior

### Source Fallback

Invalid sources are automatically removed when:

* Manifest loading fails
* Media metadata cannot be loaded
* Network requests fail

The player will continue using remaining valid sources when available.

### Language Filtering

When audio sources define a `lang` attribute, only sources matching the currently selected language are considered for bitrate selection.

## Accessibility Notes

* Stops click and double-click propagation to avoid interfering with player controls
* Can be used with native buttons, menus, and custom UI controls
* Works with both audio-only and video playback scenarios
