import { Component, booleanAttribute, computed, contentChild, contentChildren, input, model } from '@angular/core';
import { NgxMenuDirective } from '../../directives/menu/menu.directive';
import { NgxOptionDirective } from '../../directives/option/option.directive';
import { NgxTriggerDirective } from '../../directives/trigger/trigger.directive';

@Component({
    selector: 'ngx-select, [ngx-select]',
    templateUrl: './select.component.html',
    styleUrl: './select.component.scss',
    exportAs: 'ngxSelect'
})
export class NgxSelectComponent {
    readonly multi = input(false, {
        transform: (value: unknown) => {
            const result = booleanAttribute(value);
            this.value.set((result ? [] : undefined));
            return result;
        }
    });

    readonly value = model<unknown | unknown[]>();

    readonly menu = contentChild.required(NgxMenuDirective);
    readonly options = contentChildren(NgxOptionDirective, { descendants: true });
    readonly trigger = contentChild.required(NgxTriggerDirective);

    readonly selected = computed(() => {
        if (this.multi()) {
            const selection = this.value() as unknown[];
            return this.options().filter((option) => selection.includes(option.value()))
        } else {
            const selection = this.value() as unknown;
            return this.options().find((option) => selection === option.value());
        }
    });
}
