import { NgModule } from '@angular/core';
import { NgxPlayerComponent } from './components/player/player.component';
import { NgxSeekBarComponent } from './components/seekbar/seekbar.component';
import { NgxLoopDirective } from './directives/loop/loop.directive';
import { NgxMuteDirective } from './directives/mute/mute.directive';
import { NgxPlayDirective } from './directives/play/play.directive';
import { NgxSeekDirective } from './directives/seek/seek.directive';
import { NgxSpeedDirective } from './directives/speed/speed.directive';
import { NgxVolumeDirective } from './directives/volume/volume.directive';
import { NgxFullscreenDirective } from './directives/fullscreen/fullscreen.directive';

@NgModule({
    imports: [
        NgxPlayerComponent,
        NgxSeekBarComponent,
        NgxFullscreenDirective,
        NgxLoopDirective,
        NgxMuteDirective,
        NgxPlayDirective,
        NgxSeekDirective,
        NgxSpeedDirective,
        NgxVolumeDirective
    ],
    exports: [
        NgxPlayerComponent,
        NgxSeekBarComponent,
        NgxFullscreenDirective,
        NgxLoopDirective,
        NgxMuteDirective,
        NgxPlayDirective,
        NgxSeekDirective,
        NgxSpeedDirective,
        NgxVolumeDirective
    ]
})
export class NgxPlayerModule {}
