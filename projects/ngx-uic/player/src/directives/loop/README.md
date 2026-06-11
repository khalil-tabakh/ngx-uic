# NgxLoopDirective

The `NgxLoopDirective` provides loop state management for media managed by `NgxPlayerComponent`.

It synchronizes the native `loop` attribute of audio and video elements, keeps its state updated when the attribute changes externally, and automatically restarts playback when loop mode is enabled after media has already ended.

## API

### Selectors

```ts
@Directive({
    selector: '[ngxLoop]',
    exportAs: 'ngxLoop'
})
```

### Properties

| Name   | Type                      | Description                            |
| ------ | ------------------------- | -------------------------------------- |
| `loop` | `WritableSignal<boolean>` | Indicates whether loop mode is enabled |

## Usage

### Toggle Loop

```html
<button ngxLoop #ngxLoop="ngxLoop">
    {{ ngxLoop.loop() ? 'Disable loop' : 'Enable loop' }}
</button>
```

⚠️ Clicking an element with the directive automatically toggles loop mode

### Example

```html
<ngx-player [audio]="audio">
    <audio #audio src="audio.mp3"></audio>

    <button ngxLoop #ngxLoop="ngxLoop">
        <span class="material-icons md-light">
            {{ ngxLoop.loop() ? 'repeat_on' : 'repeat' }}
        </span>
    </button>
</ngx-player>
```

## Behavior

### State Synchronization

Changes to the native `loop` property are automatically reflected by the directive, even when the property is modified externally.

## Accessibility Notes

* Stops click and double-click propagation to avoid interfering with player controls
* Can be attached to native buttons and custom controls
* Keeps the UI synchronized with the underlying media element
