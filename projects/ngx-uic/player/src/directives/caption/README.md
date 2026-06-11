# NgxCaptionDirective

The `NgxCaptionDirective` provides caption and subtitle management for media controlled by `NgxPlayerComponent`.

It automatically discovers available text tracks, allows switching between captions, tracks the active subtitle, and supports global cue time offsets for subtitle synchronization.

## API

### Selectors

```ts
@Directive({
    selector: '[ngxCaption]',
    exportAs: 'ngxCaption'
})
```

### Inputs

| Name     | Type     | Default | Description                                                 |
| -------- | -------- | ------- | ----------------------------------------------------------- |
| `offset` | `number` | `0`     | Time offset applied to all cues in the active caption track |

💡 Positive values delay captions, while negative values display captions earlier.

### Properties

| Name       | Type                                     | Description                           |
| ---------- | ---------------------------------------- | ------------------------------------- |
| `caption`  | `WritableSignal<TextTrack \| undefined>` | Currently selected caption            |
| `captions` | `Signal<readonly TextTrack[]>`           | Available caption and subtitle tracks |

## Usage

### Caption Selector

```html
<div ngxCaption #ngxCaption="ngxCaption">
    <button
        (click)="ngxCaption.caption.set(undefined)">
        Off
    </button>

    @for (caption of ngxCaption.captions.value(); track caption) {
        <button
            (click)="ngxCaption.caption.set(track)">
            {{ caption.label || caption.language }}
        </button>
    }
</div>
```

### Subtitle Synchronization

```html
<div ngxCaption offset="1.5"></div>
```

### Dynamic Offset

```html
<div ngxCaption [offset]="subtitleDelay()"></div>
```

### Example

```html
<ngx-player [video]="video">
    <video #video>
        <source src="movie.mp4" />
        <track kind="subtitles" srclang="en" label="English" src="en.vtt" default />
        <track kind="subtitles" srclang="es" label="Español" src="es.vtt" />
    </video>
    <div class="caption">
        <button popovertarget="caption" ngxCaption #ngxCaption="ngxCaption">
            @if (ngxCaption.caption()) {
                <span class="material-icons md-light">closed_caption</span>
            } @else {
                <span class="material-icons md-light">closed_caption_off</span>
            }
        </button>
        <fieldset id="caption" popover>
            <label>
                <input
                    type="radio"
                    name="caption"
                    [checked]="undefined === ngxCaption.caption()"
                    (change)="$event.target.checked && ngxCaption.caption.set(undefined)"
                />
                <span>None</span>
            </label>
            @for (caption of ngxCaption.captions.value(); track caption) {
                <label>
                    <input
                        type="radio"
                        name="caption"
                        [checked]="caption === ngxCaption.caption()"
                        [value]="caption"
                        (change)="$event.target.checked && ngxCaption.caption.set(caption)"
                    />
                    <span>{{ caption.label || caption.language }}</span>
                </label>
            }
        </fieldset>
    </div>
</ngx-player>
```

## Behavior

### Track Discovery

The directive automatically collects all video tracks that define a language:

```html
<track kind="subtitles" srclang="en" label="English" src="en.vtt" />
```

⚠️ Tracks without a language are ignored.

### Caption Switching

When a new caption is selected:

* All available tracks are disabled
* The selected track is switched to `showing`

⚠️ Only one caption track can be active at a time.

## Accessibility Notes

* Uses native browser `TextTrack` support
* Compatible with standard subtitle and caption tracks
* Supports screen-reader-friendly media controls
* Preserves browser-native caption rendering
* Works with subtitles, captions, and translated text tracks
