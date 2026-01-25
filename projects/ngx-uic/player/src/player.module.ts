import { NgModule } from '@angular/core';
import { NgxPlayerComponent } from './components/player/player.component';
import { NgxSeekBarComponent } from './components/seekbar/seekbar.component';

@NgModule({
    imports: [NgxPlayerComponent, NgxSeekBarComponent],
    exports: [NgxPlayerComponent, NgxSeekBarComponent]
})
export class NgxPlayerModule {}
