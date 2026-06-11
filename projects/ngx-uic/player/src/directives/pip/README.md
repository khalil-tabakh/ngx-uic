# NgxPipDirective

The `NgxPipDirective` provides Picture-in-Picture (PiP) control for video media managed by `NgxPlayerComponent`.

It synchronizes with the browser's Picture-in-Picture state, allows toggling PiP mode programmatically or through user interaction, and automatically reacts when PiP is entered or exited externally.

## API

### Selectors

```ts
@Directive({
    selector: '[ngxPip]',
    exportAs: 'ngxPip'
})
```

### Properties

| Name  | Type                      | Description                                         |
| ----- | ------------------------- | --------------------------------------------------- |
| `pip` | `WritableSignal<boolean>` | Indicates whether Picture-in-Picture mode is active |

## Usage

### Toggle Picture-in-Picture

```html
<button ngxPip #ngxPip="ngxPip">
    {{ ngxPip.pip() ? 'Exit PiP' : 'Enter PiP' }}
</button>
```

⚠️ Clicking an element with the directive automatically toggles Picture-in-Picture mode

### Example

```html
<ngx-player [video]="video">
    <video #video src="video.mp4"></video>

    <button ngxPip #ngxPip="ngxPip">
        <span class="material-icons md-light">
            {{ ngxPip.pip() ? 'picture_in_picture_alt' : 'picture_in_picture' }}
        </span>
    </button>
</ngx-player>
```

## Behavior

### State Synchronization

The directive automatically tracks the current Picture-in-Picture state and stays synchronized when PiP mode is entered or exited outside the directive.

### Automatic PiP Requests

Setting `pip` to `true` requests Picture-in-Picture mode for the current video element when supported by the browser.

### Automatic PiP Exit

Setting `pip` to `false` exits Picture-in-Picture mode if a Picture-in-Picture session is currently active.

### Video-Only Support

Picture-in-Picture is only available for video playback. If no video element is present or the browser does not support the Picture-in-Picture API, enabling PiP has no effect.

## Accessibility Notes

* Stops click and double-click propagation to avoid interfering with player controls
* Can be attached to native buttons and custom controls
* Keeps the UI synchronized with browser Picture-in-Picture events
* Supports both user-initiated and programmatic PiP changes
* Gracefully handles browsers that do not implement the Picture-in-Picture API
