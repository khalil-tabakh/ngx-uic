import { Component, ModelSignal, Signal, booleanAttribute, computed, contentChild, contentChildren, input, model } from '@angular/core';
import { NgxMenuDirective } from '../../directives/menu/menu.directive';
import { NgxOptionDirective } from '../../directives/option/option.directive';
import { Multi, Selected, Value } from '../../utils/types.util';
import { NgxTriggerDirective } from '../../directives/trigger/trigger.directive';

@Component({
    selector: 'ngx-select, [ngx-select]',
    templateUrl: './select.component.html',
    styleUrl: './select.component.scss',
    exportAs: 'ngxSelect'
})
export class NgxSelectComponent<M extends boolean | null | number | object | string | undefined, V> {
    readonly multi = input(false as Multi<M>, {
        transform: (value: M) => {
            const result = booleanAttribute(value) as Multi<M>;
            this.value.set((result ? [] : undefined) as Value<M, V>);
            return result;
        }
    });

    readonly value = model() as ModelSignal<Value<M, V>>;

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
    }) as Signal<Selected<M>>;
}
