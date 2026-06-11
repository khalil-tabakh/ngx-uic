# NgxVolumeDirective

The `NgxVolumeDirective` provides volume and mute control for media managed by `NgxPlayerComponent`.

It synchronizes volume levels across audio and video elements, automatically handles mute states, and exposes a writable volume signal that can be connected to sliders, buttons, and custom volume controls.

## API

### Selectors

```ts
@Directive({
    selector: '[ngxVolume]',
    exportAs: 'ngxVolume'
})
```

### Properties

| Name     | Type                     | Description                              |
| -------- | ------------------------ | ---------------------------------------- |
| `volume` | `WritableSignal<number>` | Current volume level between `0` and `1` |

## Usage

### Volume Slider

```html
<input
    type="range"
    max="1"
    step="0.01"
    [value]="ngxVolume.volume()"
    (input)="ngxVolume.volume.set(+volume.value)"
    ngxVolume
    #ngxVolume="ngxVolume"
    #volume
/>
```

### Example

```html
<ngx-player [video]="video">
    <video #video>
        <source src="video.mp4" />
    </video>
    <button class="button mute" ngxMute #ngxMute="ngxMute">
        @if (ngxMute.muted()) {
            <span class="material-icons md-light">volume_off</span>
        } @else if (ngxVolume.volume() < 0.33) {
            <span class="material-icons md-light">volume_mute</span>
        } @else if (ngxVolume.volume() < 0.66) {
            <span class="material-icons md-light">volume_down</span>
        } @else {
            <span class="material-icons md-light">volume_up</span>
        }
    </button>
    <input
        type="range"
        max="1"
        step="0.01"
        [value]="ngxVolume.volume()"
        (input)="ngxVolume.volume.set(+volume.value)"
        ngxVolume
        #ngxVolume="ngxVolume"
        #volume
    />
</ngx-player>
```

## Behavior

### Volume Control

Updating the `volume` signal immediately updates the volume level of the active media elements.

Valid values range from:

* `0` = Muted
* `1` = Maximum volume

Intermediate decimal values are supported.

### Automatic Mute Handling

The directive automatically manages mute states based on the current volume.

When:

* `volume === 0` → media is muted
* `volume > 0` → media is unmuted

This behavior applies automatically without requiring manual mute management.

### Audio and Video Synchronization

When both audio and video elements are present:

* The same volume level is applied to both elements
* Volume changes remain synchronized
* Native volume changes update the directive state automatically

### Separate Audio Tracks

When an external audio source is active:

* Volume is applied to the audio element
* The video element is automatically muted
* Playback audio is routed exclusively through the selected audio track

This prevents duplicate audio playback from video sources containing embedded audio.

### Native Volume Changes

The directive listens for native `volumechange` events.

Changes triggered by:

* Browser media controls
* External scripts
* Programmatic volume updates

are automatically reflected in the `volume` signal.

### State Synchronization

The `volume` signal always reflects the effective media state. Changes triggered by:

* Muted media reports `0`
* Unmuted media reports the current volume level
* Updates remain synchronized with the underlying media elements

## Accessibility Notes

* Stops click and double-click propagation to avoid interfering with player controls
* Works with both audio and video playback
* Supports custom sliders, buttons, and volume menus
* Automatically synchronizes with native media volume controls
* Handles mute and unmute transitions transparently
