import { NgModule } from '@angular/core';
import { NgxPlayerComponent } from './components/player/player.component';
import { NgxSeekBarComponent } from './components/seekbar/seekbar.component';
import { NgxSeekDirective } from './directives/seek/seek.directive';

@NgModule({
    imports: [NgxPlayerComponent, NgxSeekBarComponent, NgxSeekDirective],
    exports: [NgxPlayerComponent, NgxSeekBarComponent, NgxSeekDirective]
})
export class NgxPlayerModule {}
