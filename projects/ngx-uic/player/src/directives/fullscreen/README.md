# NgxFullscreenDirective

The `NgxFullscreenDirective` provides fullscreen control for media managed by `NgxPlayerComponent`.

It automatically synchronizes with the browser's Fullscreen API, allowing fullscreen mode to be toggled programmatically or through user interaction while keeping its state reactive.

## API

### Selectors

```ts
@Directive({
    selector: '[ngxFullscreen]',
    exportAs: 'ngxFullscreen'
})
```

### Properties

| Name         | Type                      | Default                  | Description                                        |
| ------------ | ------------------------- | ------------------------ | -------------------------------------------------- |
| `fullscreen` | `WritableSignal<boolean>` | Browser fullscreen state | Indicates whether the player is in fullscreen mode |

## Usage

### Toggle Fullscreen

```html
<button ngxFullscreen #fullscreen="ngxFullscreen">
    {{ fullscreen.fullscreen() ? 'Exit Fullscreen' : 'Enter Fullscreen' }}
</button>
```

⚠️ Clicking an element with the directive automatically toggles fullscreen mode

### Example

```html
<ngx-player [video]="video">
    <video #video controls>
        <source src="video.mp4" />
    </video>
    <button ngxFullscreen #ngxFullscreen="ngxFullscreen">
        @if (ngxFullscreen.fullscreen()) {
            <span class="material-icons md-light">fullscreen_exit</span>
        } @else {
            <span class="material-icons md-light">fullscreen</span>
        }
    </button>
</ngx-player>
```

⚠️ Fullscreen is applied to the `NgxPlayerComponent` native element

## Behavior

### State Synchronization

The directive automatically listens for fullscreen changes to ensures that:

* Pressing `ESC` updates the signal
* Browser fullscreen controls update the signal
* Programmatic fullscreen changes remain synchronized

## Accessibility Notes

* Supports native browser fullscreen behavior
* Synchronizes with browser accessibility features
* Can be integrated with custom accessible buttons and menus
