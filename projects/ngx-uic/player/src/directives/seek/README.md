# NgxSeekDirective

The `NgxSeekDirective` provides relative seeking controls for media managed by `NgxPlayerComponent`.

It allows skipping forward or backward by a configurable number of seconds and automatically prevents seeking beyond the beginning or end of the media.

## API

### Selectors

```ts
@Directive({
    selector: '[ngxSeek]',
    exportAs: 'ngxSeek'
})
```

### Inputs

| Name    | Type     | Description                                                         |
| ------- | -------- | ------------------------------------------------------------------- |
| `value` | `number` | Number of seconds to seek relative to the current playback position |

## Usage

### Seek Forward

```html
<button ngxSeek [value]="10">
    Forward 10s
</button>
```

### Seek Backward

```html
<button ngxSeek [value]="-10">
    Backward 10s
</button>
```

### Example

```html
<ngx-player [video]="video">
    <video #video src="video.mp4"></video>

    <button ngxSeek [value]="-10">
        <span class="material-icons md-light">
            replay_10
        </span>
    </button>

    <button ngxSeek [value]="10">
        <span class="material-icons md-light">
            forward_10
        </span>
    </button>
</ngx-player>
```

## Behavior

### Relative Seeking

The directive seeks relative to the current playback position rather than to an absolute time.

### Boundary Clamping

Seeking is automatically limited to the valid media range:

* Values below `0` are clamped to the beginning of the media
* Values beyond the media duration are clamped to the end of the media

### Audio and Video Support

The directive works with both audio and video elements managed by `NgxPlayerComponent`.

### Shared Playback Position

When both audio and video elements are present, the same target playback position is applied to both elements.

## Accessibility Notes

* Stops click and double-click propagation to avoid interfering with player controls
* Can be attached to native buttons and custom controls
* Supports positive and negative seek intervals
* Can be used to implement rewind, fast-forward, replay, and skip-intro controls
