import { NgModule } from '@angular/core';
import { NgxRangeComponent } from './components/range/range.component';
import { NgxSegmentDirective } from './directives/segment/segment.directive';

@NgModule({
    imports: [NgxRangeComponent, NgxSegmentDirective],
    exports: [NgxRangeComponent, NgxSegmentDirective]
})
export class NgxRangeModule {}
