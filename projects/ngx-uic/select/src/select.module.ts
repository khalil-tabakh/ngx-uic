import { NgModule } from '@angular/core';
import { NgxSelectComponent } from './components/select/select.component';
import { NgxOptionDirective } from './directives/option/option.directive';
import { NgxPopupDirective } from './directives/popup/popup.directive';
import { NgxTriggerDirective } from './directives/trigger/trigger.directive';

@NgModule({
    imports: [
        NgxSelectComponent,
        NgxOptionDirective,
        NgxPopupDirective,
        NgxTriggerDirective
    ],
    exports: [
        NgxSelectComponent,
        NgxOptionDirective,
        NgxPopupDirective,
        NgxTriggerDirective
    ]
})
export class NgxSelectModule {}
