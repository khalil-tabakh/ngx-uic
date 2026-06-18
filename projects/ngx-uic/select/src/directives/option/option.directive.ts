import { Directive, inject, input } from '@angular/core';
import { NgxSelectComponent } from '../../components/select/select.component';

@Directive({
    selector: '[ngxOption]',
    host: { '(click)': 'onToggle()' },
    exportAs: 'ngxOption'
})
export class NgxOptionDirective<T = unknown> {
    private select = inject(NgxSelectComponent);

    readonly value = input<T>();

    protected onToggle(): void {
        this.select.value.set(this.value());
    }
}
