# NgxPlayDirective

The `NgxPlayDirective` provides play and pause controls for media managed by `NgxPlayerComponent`.

It automatically synchronizes playback state between audio and video elements, exposes playback status signals, and handles loading and ended states.

## API

### Selectors

```ts
@Directive({
    selector: '[ngxPlay]',
    exportAs: 'ngxPlay'
})
```

### Properties

| Name     | Type                      | Description                                                 |
| -------- | ------------------------- | ----------------------------------------------------------- |
| `ended`  | `Resource<boolean>`       | Indicates whether playback has reached the end of the media |
| `paused` | `WritableSignal<boolean>` | Current playback state                                      |

## Usage

### Play / Pause Button

```html
<button ngxPlay #ngxPlay="ngxPlay">
    {{ ngxPlay.paused() ? 'Play' : 'Pause' }}
</button>
```

⚠️ Clicking an element with the directive automatically toggles paused state

### Playback End Detection

```html
<div ngxPlay #ngxPlay="ngxPlay">
    @if (ngxPlay.ended.value()) {
        <span>Playback completed</span>
    }
</div>
```

### Example

```html
<ngx-player [video]="video">
    <video #video>
        <source src="video.mp4" />
    </video>
    <button class="button play" ngxPlay #ngxPlay="ngxPlay">
        @switch (true) {
            @case (ngxPlay.ended.value()) {
                <span class="material-icons md-light">replay</span>
            }
            @case (ngxPlay.paused()) {
                <span class="material-icons md-light">play_arrow</span>
            }
            @default {
                <span class="material-icons md-light">pause</span>
            }
        }
    </button>
</ngx-player>
```

## Behavior

### Loading State Handling

When media is loading:

* Playback is temporarily paused
* Play requests are deferred until loading completes
* The current playback state remains synchronized with the player

This prevents playback interruptions caused by incomplete media initialization.

### Audio and Video Synchronization

When both audio and video elements are present:

* Playback is started and paused simultaneously
* Playback positions are automatically synchronized
* Small timing differences are corrected automatically

This ensures that separate audio and video tracks remain aligned during playback.

## Accessibility Notes

* Stops click and double-click propagation to avoid interfering with player controls
* Works with both audio and video playback
* Supports synchronized audio/video playback scenarios
* Can be attached to buttons, icons, menus, and custom playback controls
* Automatically reflects native media playback state changes
