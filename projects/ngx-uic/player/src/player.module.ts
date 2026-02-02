import { NgModule } from '@angular/core';
import { NgxPlayerComponent } from './components/player/player.component';
import { NgxSeekBarComponent } from './components/seekbar/seekbar.component';
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

@NgModule({
    imports: [
        NgxPlayerComponent,
        NgxSeekBarComponent,
        NgxFullscreenDirective,
        NgxLanguageDirective,
        NgxLoopDirective,
        NgxMuteDirective,
        NgxPipDirective,
        NgxPlayDirective,
        NgxResolutionDirective,
        NgxSeekDirective,
        NgxSpeedDirective,
        NgxVolumeDirective
    ],
    exports: [
        NgxPlayerComponent,
        NgxSeekBarComponent,
        NgxFullscreenDirective,
        NgxLanguageDirective,
        NgxLoopDirective,
        NgxMuteDirective,
        NgxPipDirective,
        NgxPlayDirective,
        NgxResolutionDirective,
        NgxSeekDirective,
        NgxSpeedDirective,
        NgxVolumeDirective
    ]
})
export class NgxPlayerModule {}
