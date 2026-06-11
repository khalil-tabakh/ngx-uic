# NgxMuteDirective

The `NgxMuteDirective` provides mute state management for media managed by `NgxPlayerComponent`.

It synchronizes the native `muted` property of audio and video elements, keeps its state updated when mute changes externally, and automatically ensures that video playback remains muted when a separate audio source is being used.

## API

### Selectors

```ts
@Directive({
    selector: '[ngxMute]',
    exportAs: 'ngxMute'
})
```

### Properties

| Name    | Type                      | Description                             |
| ------- | ------------------------- | --------------------------------------- |
| `muted` | `WritableSignal<boolean>` | Indicates whether audio output is muted |

## Usage

### Toggle Muted

```html
<button ngxMute #ngxMute="ngxMute">
    {{ ngxMute.muted() ? 'Unmute' : 'Mute' }}
</button>
```

⚠️ Clicking an element with the directive automatically toggles muted state

### Example

```html
<ngx-player [video]="video">
    <video #video src="video.mp4"></video>

    <button ngxMute #ngxMute="ngxMute">
        <span class="material-icons md-light">
            {{ ngxMute.muted() ? 'volume_off' : 'volume_up' }}
        </span>
    </button>
</ngx-player>
```

## Behavior

### State Synchronization

Changes to the native `muted` property are automatically reflected by the directive, even when the property is modified externally.

### Volume Change Detection

Mute state updates are tracked through both the `muted` attribute and the media element's `volumechange` event.

### External Audio Sources

When a dedicated audio source is used alongside a video element, the video remains muted to avoid duplicate audio playback.

### Audio and Video Support

The directive works with both audio and video elements managed by `NgxPlayerComponent`.

## Accessibility Notes

* Stops click and double-click propagation to avoid interfering with player controls
* Can be attached to native buttons and custom controls
* Keeps the UI synchronized with the underlying media element
* Reacts to mute changes performed by browser controls or external code
