# NgxPlayerModule

The `NgxPlayerModule` provides a complete set of media playback utilities for Angular applications. It includes the `NgxPlayerComponent`, playback control directives, media quality selection, caption handling, fullscreen support, and formatting utilities for building custom audio and video players.

The module supports native media playback as well as adaptive streaming through **HLS** and **MPEG-DASH** sources.

## Features

▶️ Audio & Video playback synchronization

📺 HLS (`.m3u8`) streaming support

📡 MPEG-DASH (`.mpd`) streaming support

🚫 Automatic invalid source removal

🔄 Automatic source failover

💾 Playback position preservation

🌐 Language-aware media sources filtering and selection

✅ Automatic bitrate & resolution discovery

📊 Bitrate and resolution selection

🎚️ Volume & mute controls

⚡ Playback speed controls

🔁 Loop mode

⏩ Seeking support

🖼️ Picture-in-Picture support

🖥️ Fullscreen support

🎞️ Caption track management

⏳ Reactive loading state detection

⏱️ Media time formatting pipe

## Components

* [`NgxPlayerComponent`](src/components/player/README.md)

## Directives

* [`NgxBitrateDirective`](src/directives/bitrate/README.md)
* [`NgxCaptionDirective`](src/directives/caption/README.md)
* [`NgxFullscreenDirective`](src/directives/fullscreen/README.md)
* [`NgxLanguageDirective`](src/directives/language/README.md)
* [`NgxMuteDirective`](src/directives/mute/README.md)
* [`NgxPipDirective`](src/directives/pip/README.md)
* [`NgxPlayDirective`](src/directives/play/README.md)
* [`NgxResolutionDirective`](src/directives/resolution/README.md)
* [`NgxSeekBarDirective`](src/directives/seekbar/README.md)
* [`NgxSeekDirective`](src/directives/seek/README.md)
* [`NgxSpeedDirective`](src/directives/speed/README.md)
* [`NgxVolumeDirective`](src/directives/volume/README.md)

## Pipes

* [`NgxTimePipe`](src/pipes/time/README.md)
