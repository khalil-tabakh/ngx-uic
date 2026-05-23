import { NgModule } from '@angular/core';
import { NgxPlayerComponent } from './components/player/player.component';
import { NgxSeekBarDirective } from './directives/seekbar/seekbar.directive';
import { NgxBitrateDirective } from './directives/bitrate/bitrate.directive';
import { NgxCaptionDirective } from './directives/caption/caption.directive';
import { NgxFullscreenDirective } from './directives/fullscreen/fullscreen.directive';
import { NgxLanguageDirective } from './directives/language/language.directive';
import { NgxLoopDirective } from './directives/loop/loop.directive';
import { NgxMuteDirective } from './directives/mute/mute.directive';
import { NgxPipDirective } from './directives/pip/pip.directive';
import { NgxPlayDirective } from './directives/play/play.directive';
import { NgxResolutionDirective } from './directives/resolution/resolution.directive';
import { NgxSeekDirective } from './directives/seek/seek.directive';
import { NgxSpeedDirective } from './directives/speed/speed.directive';
import { NgxVolumeDirective } from './directives/volume/volume.directive';
import { NgxTimePipe } from './pipes/time/time.pipe';

@NgModule({
    imports: [
        NgxPlayerComponent,
        NgxSeekBarDirective,
        NgxBitrateDirective,
        NgxCaptionDirective,
        NgxFullscreenDirective,
        NgxLanguageDirective,
        NgxLoopDirective,
        NgxMuteDirective,
        NgxPipDirective,
        NgxPlayDirective,
        NgxResolutionDirective,
        NgxSeekDirective,
        NgxSpeedDirective,
        NgxVolumeDirective,
        NgxTimePipe
    ],
    exports: [
        NgxPlayerComponent,
        NgxSeekBarDirective,
        NgxBitrateDirective,
        NgxCaptionDirective,
        NgxFullscreenDirective,
        NgxLanguageDirective,
        NgxLoopDirective,
        NgxMuteDirective,
        NgxPipDirective,
        NgxPlayDirective,
        NgxResolutionDirective,
        NgxSeekDirective,
        NgxSpeedDirective,
        NgxVolumeDirective,
        NgxTimePipe
    ]
})
export class NgxPlayerModule {}
