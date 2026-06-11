# NgxPlayerComponent

Lightweight media orchestration component that enhances native HTML audio and video elements with automatic HLS and MPEG-DASH playback support, source failover handling, loading state tracking and audio tracks detection.

## API

### Selectors

```ts
@Component({
    selector: 'ngx-player, [ngx-player]',
    exportAs: 'ngxPlayer'
})
```

### Inputs

| Name              | Type                      | Default     | Description                               | Note                     |
| ----------------- | ------------------------- | ----------- | ----------------------------------------- | ------------------------ |
| `audio`           | `HTMLAudioElement`        | `undefined` | Audio element managed by the player       | -                        |
| `audioDashConfig` | `MediaPlayerSettingClass` | `{}`        | MPEG-DASH configuration for audio streams | Used for `.mpd` sources  |
| `audioHLSConfig`  | `Partial<HlsConfig>`      | `undefined` | HLS configuration for audio streams       | Used for `.m3u8` sources |
| `video`           | `HTMLVideoElement`        | `undefined` | Video element managed by the player       | -                        |
| `videoDashConfig` | `MediaPlayerSettingClass` | `{}`        | MPEG-DASH configuration for video streams | Used for `.mpd` sources  |
| `videoHLSConfig`  | `Partial<HlsConfig>`      | `undefined` | HLS configuration for video streams       | Used for `.m3u8` sources |

### Properties

| Name           | Type                                             | Description                                          |
| -------------- | ------------------------------------------------ | ---------------------------------------------------- |
| `audioDash`    | `Resource<MediaPlayer \| undefined>`             | Active Dash.js instance for audio playback           |
| `audioHLS`     | `Resource<Hls \| undefined>`                     | Active Hls.js instance for audio playback            |
| `audioSource`  | `WritableSignal<HTMLSourceElement \| undefined>` | Currently active audio source                        |
| `audioSources` | `WritableSignal<readonly HTMLSourceElement[]>`   | Available audio sources                              |
| `element`      | `HTMLElement`                                    | Host element reference                               |
| `isAudible`    | `Resource<boolean>`                              | Indicates whether loaded media contains audio tracks |
| `isLoading`    | `Resource<boolean>`                              | Indicates whether media is currently loading         |
| `videoDash`    | `Resource<MediaPlayer \| undefined>`             | Active Dash.js instance for video playback           |
| `videoHLS`     | `Resource<Hls \| undefined>`                     | Active Hls.js instance for video playback            |
| `videoSource`  | `WritableSignal<HTMLSourceElement \| undefined>` | Currently active video source                        |
| `videoSources` | `WritableSignal<readonly HTMLSourceElement[]>`   | Available video sources                              |
| `videoTracks`  | `WritableSignal<readonly HTMLTrackElement[]>`    | Available subtitle and caption tracks                |

## Usage

```ts
import { NgxPlayerModule } from 'ngx-uic/player';

@Component({
    selector: 'app-root',
    imports: [NgxPlayerModule], // <- Add here
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {}
```

### Video Playback

```html
<ngx-player [video]="video" #player="ngxPlayer">
    <video #video>
        <source src="video-1080p.mp4" />
        <source src="video-720p.mp4" />
    </video>
</ngx-player>
```

### HLS Playback

```html
<ngx-player [video]="video">
    <video #video>
        <source src="https://example.com/live.m3u8" />
    </video>
</ngx-player>
```

### MPEG-DASH Playback

```html
<ngx-player [video]="video">
    <video #video>
        <source src="https://example.com/live.mpd" />
    </video>
</ngx-player>
```

### Audio Playback

```html
<ngx-player [audio]="audio">
    <audio #audio>
        <source src="audio.mp3" />
    </audio>
</ngx-player>
```

### Accessing Player State

```html
<ngx-player [video]="video" #player="ngxPlayer">
    <video #video>
        <source src="video.mp4" />
    </video>
    @if (player.isAudible.value()) {
        <div>No audio track detected</div>
    }
    @if (player.isLoading.value()) {
        <div>Loading...</div>
    }
</ngx-player>
```

## Behavior

### Adaptive Streaming Support

The component automatically detects source types and initializes the appropriate playback engine:

| Extension | Engine                  |
| --------- | ----------------------- |
| `.m3u8`   | HLS.js                  |
| `.mpd`    | Dash.js                 |
| Other     | Native browser playback |

### Source Failover

If a source fails to load, it is automatically removed from the available source list and the browser may continue attempting playback using remaining sources.

This behavior applies to:

* Audio sources
* Video sources
* Video subtitle tracks

## Accessibility Notes

* Uses native `HTMLAudioElement` and `HTMLVideoElement`
* Compatible with screen readers through standard media semantics
* Preserves browser-native media accessibility features
