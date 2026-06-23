import { Directive, ElementRef, inject, model, resource, signal } from '@angular/core';
import { NgxSelectComponent } from '../../components/select/select.component';

let id = 0;

@Directive({
    selector: '[ngxPopup]',
    exportAs: 'ngxPopup',
    host: {
        'role': 'listbox',
        'tabindex': '0',
        '[aria-activedescendant]': 'active.value()?.element?.id',
        '[aria-multiselectable]': 'select.multi()',
        '(click)': 'onClose()',
        '(keypress)': 'onClose($event)',
        '(toggle)': 'onToggle($event)'
    },
})
export class NgxPopupDirective {
    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    protected select = inject(NgxSelectComponent);
    
    readonly expanded = model(false);

    protected active = resource({
        params: () => ({ expanded: this.expanded(), options: this.select.options() }),
        stream: ({ abortSignal, params }) => {
            const { expanded, options } = params;
            const response = signal({ value: expanded ? options.at(0) : undefined });
            this.element.addEventListener('keydown', (event) => {
                switch (event.code) {
                    case 'ArrowDown':
                        response.update(({ value: option }) => {
                            const index = options.indexOf(option!);
                            return ({ value: options.at(index - 1) });
                        });
                        break;
                    case 'ArrowUp':
                        response.update(({ value: option }) => {
                            const index = options.indexOf(option!);
                            return ({ value: options.at(index + 1 >= options.length ? 0 : index + 1) });
                        });
                        break;
                }
            }, { signal: abortSignal });
            return response;
        }
    }).asReadonly();

    constructor() {
        this.element.id ||= `ngx-popup-${id++}`;
        const positionAnchor = `--${this.element.id}`;
        if (!getComputedStyle(this.element).positionAnchor) this.element.style.setProperty('position-anchor', '--' + positionAnchor);
        if (this.element instanceof HTMLDialogElement) !this.element.getAttribute('closedby') && this.element.setAttribute('closedby', 'any');
        else this.element.popover = 'auto';
    }

    protected onClose(event?: KeyboardEvent): void {
        if (event && event.code !== 'Enter') return;
        if (!this.select.multi()) this.element instanceof HTMLDialogElement ? this.element.close() : this.element.hidePopover();
    }

    protected onToggle(event: ToggleEvent): void {
        this.expanded.set(event.newState === 'open');
        this.expanded() ? this.element.focus() : this.element.blur();
        this.element.ariaActiveDescendantElement = this.expanded() ? this.select.options().at(0)?.element || null : null;
        if (!this.expanded()) this.select.onTouched();
    }
}
