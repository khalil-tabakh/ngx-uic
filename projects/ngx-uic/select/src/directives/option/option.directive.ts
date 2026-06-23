import { Directive, ElementRef, booleanAttribute, computed, inject, input, resource, signal } from '@angular/core';
import { NgxSelectComponent } from '../../components/select/select.component';

let id = 0;

@Directive({
    selector: '[ngxOption]',
    exportAs: 'ngxOption',
    host: {
        'role': 'option',
        '[aria-disabled]': 'disabled()',
        '[aria-selected]': 'selected()',
        '[attr.data-active]': 'active.value()',
        '(click)': '!disabled() && onToggle()'
    }
})
export class NgxOptionDirective<T = unknown> {
    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private select = inject(NgxSelectComponent<boolean, unknown>);

    readonly disabled = input(false, { transform: booleanAttribute });
    readonly value = input<T>();

    protected active = resource({
        params: () => ({ popup: this.select.popup().element, option: this.element }),
        stream: ({ abortSignal, params }) => {
            const { popup, option } = params;
            const response = signal({ value: popup.ariaActiveDescendantElement === option });
            const mutation$ = new MutationObserver(() => response.set({ value: popup.ariaActiveDescendantElement === option }));
            mutation$.observe(popup, { attributeFilter: ['aria-activedescendant'] });
            abortSignal.addEventListener('abort', () => mutation$.disconnect(), { once: true });
            return response;
        }
    });

    readonly selected = computed(() => {
        if (this.select.multi()) {
            const selected = this.select.selected() as ReadonlyArray<NgxOptionDirective<T>>;
            return selected.includes(this);
        } else {
            const selected = this.select.selected() as NgxOptionDirective<T>;
            return selected === this;
        };
    });

    constructor() {
        this.element.id ||= `ngx-option-${id++}`;
    }

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
        if (newSelection !== oldSelection) {
            this.select.onChange(newSelection);
            this.element.dispatchEvent(new Event('input'));
            this.element.dispatchEvent(new Event('change'));
        }
    }
}
