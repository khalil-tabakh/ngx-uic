import { Component, ModelSignal, Signal, booleanAttribute, computed, contentChild, contentChildren, forwardRef, input, model } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgxOptionDirective } from '../../directives/option/option.directive';
import { NgxPopupDirective } from '../../directives/popup/popup.directive';
import { NgxTriggerDirective } from '../../directives/trigger/trigger.directive';
import { Multi, Selected, Value } from '../../utils/types.util';

@Component({
    selector: 'ngx-select, [ngx-select]',
    templateUrl: './select.component.html',
    styleUrl: './select.component.scss',
    exportAs: 'ngxSelect',
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => NgxSelectComponent),
        multi: true
    }]
})
export class NgxSelectComponent<M extends boolean | null | number | object | string | undefined, V> implements ControlValueAccessor {
    readonly multi = input(false as Multi<M>, {
        transform: (value: M) => {
            const result = booleanAttribute(value) as Multi<M>;
            this.value.set((result ? [] : undefined) as Value<M, V>);
            return result;
        }
    });

    readonly value = model() as ModelSignal<Value<M, V>>;

    readonly options = contentChildren(NgxOptionDirective, { descendants: true });
    readonly popup = contentChild.required(NgxPopupDirective);
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

    /* ControlValueAccessor */

    onChange = (_: ReturnType<typeof this.value>): void => {};

    onTouched = (): void => {};

    registerOnChange(fn: typeof this.onChange): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: typeof this.onTouched): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        const popup = this.popup().element;
        popup instanceof HTMLDialogElement ? popup.close() : popup.hidePopover();
        const trigger = this.trigger().element;
        trigger instanceof HTMLButtonElement ? (trigger.disabled = isDisabled) : (trigger.inert = isDisabled);
    }

    writeValue(value: ReturnType<typeof this.value>): void {
        this.value.set(value);
    }
}
