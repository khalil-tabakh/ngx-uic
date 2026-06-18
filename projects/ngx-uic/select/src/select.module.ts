import { NgModule } from '@angular/core';
import { NgxSelectComponent } from './components/select/select.component';
import { NgxMenuDirective } from './directives/menu/menu.directive';
import { NgxOptionDirective } from './directives/option/option.directive';
import { NgxTriggerDirective } from './directives/trigger/trigger.directive';

@NgModule({
    imports: [
        NgxSelectComponent,
        NgxMenuDirective,
        NgxOptionDirective,
        NgxTriggerDirective
    ],
    exports: [
        NgxSelectComponent,
        NgxMenuDirective,
        NgxOptionDirective,
        NgxTriggerDirective
    ]
})
export class NgxSelectModule {}
