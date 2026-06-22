import { Component, Signal, booleanAttribute, computed, contentChild, contentChildren, effect, inject, input, model } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { FormValueControl } from '@angular/forms/signals';
import { NgxOptionDirective } from '../../directives/option/option.directive';
import { NgxPopupDirective } from '../../directives/popup/popup.directive';
import { NgxTriggerDirective } from '../../directives/trigger/trigger.directive';
import { Multi, Selected, Value } from '../../utils/types.util';

@Component({
    selector: 'ngx-select, [ngx-select]',
    templateUrl: './select.component.html',
    styleUrl: './select.component.scss',
    exportAs: 'ngxSelect'
})
export class NgxSelectComponent<M extends boolean | null | number | object | string | undefined, V> implements ControlValueAccessor, FormValueControl<Value<M, V>> {
    private ngControl = inject(NgControl, { optional: true, self: true });

    readonly multi = input(false as Multi<M>, {
        transform: (value: M) => {
            const multi = booleanAttribute(value) as Multi<M>;
            this.value.set((multi ? [] : undefined) as ReturnType<typeof this.value>);
            return multi;
        }
    });

    readonly disabled = model(false);
    readonly value = model(undefined as Value<M, V>);

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

    private toggle$ = effect(() => {
        const popup = this.popup().element;
        popup instanceof HTMLDialogElement ? popup.close() : popup.hidePopover();
        const trigger = this.trigger().element;
        trigger instanceof HTMLButtonElement || (trigger instanceof HTMLInputElement && trigger.type === 'button')
            ? trigger.disabled = this.disabled()
            : trigger.inert = this.disabled();
    });

    constructor() {
        if (this.ngControl && !this.ngControl.control) this.ngControl.valueAccessor = this;
    }

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
        this.disabled.set(isDisabled);
    }

    writeValue(value: ReturnType<typeof this.value>): void {
        this.value.set(value);
    }

    /* FormValueControl */

    focus(options?: FocusOptions): void {
        this.trigger().element.focus(options);
    }
}
