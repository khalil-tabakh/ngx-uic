import { Component, computed, contentChild, contentChildren, model } from '@angular/core';
import { NgxMenuDirective } from '../../directives/menu/menu.directive';
import { NgxOptionDirective } from '../../directives/option/option.directive';

@Component({
    selector: 'ngx-select, [ngx-select]',
    templateUrl: './select.component.html',
    styleUrl: './select.component.scss',
    exportAs: 'ngxSelect'
})
export class NgxSelectComponent {
    readonly value = model<unknown>();

    readonly menu = contentChild.required(NgxMenuDirective);
    readonly options = contentChildren(NgxOptionDirective, { descendants: true });
    readonly trigger = contentChild.required(NgxTriggerDirective);

    readonly selected = computed(() => this.options().find((option) => this.value() === option.value()));
}
