import { NgModule } from '@angular/core';
import { NgxPlayerComponent } from './components/player/player.component';
import { NgxSeekBarComponent } from './components/seekbar/seekbar.component';
import { NgxPlayDirective } from './directives/play/play.directive';
import { NgxSeekDirective } from './directives/seek/seek.directive';

@NgModule({
    imports: [NgxPlayerComponent, NgxSeekBarComponent, NgxPlayDirective, NgxSeekDirective],
    exports: [NgxPlayerComponent, NgxSeekBarComponent, NgxPlayDirective, NgxSeekDirective]
})
export class NgxPlayerModule {}
