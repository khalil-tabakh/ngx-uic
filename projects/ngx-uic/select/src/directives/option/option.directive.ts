import { Directive, inject, input } from '@angular/core';
import { NgxSelectComponent } from '../../components/select/select.component';

@Directive({
    selector: '[ngxOption]',
    host: { '(click)': 'onToggle()' },
    exportAs: 'ngxOption'
})
export class NgxOptionDirective<T = unknown> {
    private select = inject(NgxSelectComponent<boolean, unknown>);

    readonly value = input<T>();

    protected onToggle(): void {
        const oldSelection = this.select.value();
        if (this.select.multi()) {
            const selected = this.select.selected() as ReadonlyArray<NgxOptionDirective<T>>;
            const selection = selected.includes(this) ? selected.filter((option) => option !== this) : selected.concat(this);
            const options = this.select.options().filter((option) => selection.includes(option)); // Sort by initial order
            if (this.value() === undefined) this.select.value.set([]);
            else this.select.value.set(options.map((option) => option.value()));
        } else this.select.value.set(this.value());
        const newSelection = this.select.value();
        if (newSelection !== oldSelection) this.select.onChange(newSelection);
    }
}
