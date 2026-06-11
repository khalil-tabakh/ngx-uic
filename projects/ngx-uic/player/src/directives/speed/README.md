# NgxSpeedDirective

The `NgxSpeedDirective` provides playback speed management for media managed by `NgxPlayerComponent`.

It synchronizes the playback rate of audio and video elements, keeps its state updated when playback speed changes externally, and enables building custom playback speed controls.

## API

### Selectors

```ts
@Directive({
    selector: '[ngxSpeed]',
    exportAs: 'ngxSpeed'
})
```

### Properties

| Name    | Type                     | Description            |
| ------- | ------------------------ | ---------------------- |
| `speed` | `WritableSignal<number>` | Current playback speed |

## Usage

### Playback Speed Selector

```html
<div ngxSpeed #speed="ngxSpeed">
    @for (value of [0.5, 1, 1.25, 1.5, 2]; track value) {
        <button
            [disabled]="value === speed.speed()"
            (click)="speed.speed.set(value)">
            {{ value }}×
        </button>
    }
</div>
```

### Example

```html
<ngx-player [video]="video">
    <video #video src="video.mp4"></video>
    <div class="speed" ngxSpeed #ngxSpeed="ngxSpeed">
        <button popovertarget="speed">
            {{ ngxSpeed.speed() }}×
        </button>
        <fieldset id="speed" popover>
            @for (value of [0.5, 1, 1.25, 1.5, 2]; track value) {
                <label>
                    <input
                        type="radio"
                        name="speed"
                        [checked]="value === ngxSpeed.speed()"
                        (change)="ngxSpeed.speed.set(value)"
                    />
                    <span>{{ value }}×</span>
                </label>
            }
        </fieldset>
    </div>
</ngx-player>
```

## Behavior

### Playback Rate Synchronization

When playback rate is modified externally, such as through browser controls or custom code, the directive automatically updates its state.

### Audio and Video Support

The directive works with both audio and video elements managed by `NgxPlayerComponent`.

### Shared Playback Rate

When both audio and video elements are present, the same playback speed is applied to both elements to keep them synchronized.

## Accessibility Notes

* Stops click and double-click propagation to avoid interfering with player controls
* Can be attached to native buttons, menus, and custom UI controls
* Keeps the UI synchronized with native playback rate changes
* Works with both audio-only and video playback scenarios
* Supports any playback rate accepted by the underlying media element
