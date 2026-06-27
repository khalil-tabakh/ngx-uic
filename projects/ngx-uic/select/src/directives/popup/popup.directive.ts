import { Directive, ElementRef, inject, linkedSignal, model } from '@angular/core';
import { NgxSelectComponent } from '../../components/select/select.component';

let id = 0;

@Directive({
    selector: '[ngxPopup]',
    exportAs: 'ngxPopup',
    host: {
        'role': 'listbox',
        'tabindex': '0',
        '[aria-activedescendant]': 'active()?.element?.id',
        '[aria-multiselectable]': 'select.multi()',
        '(keydown)': 'onSelect($event)',
        '(pointerup)': '$event.target !== element && onClose()',
        '(toggle)': 'onToggle($event)'
    },
})
export class NgxPopupDirective {
    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    protected select = inject(NgxSelectComponent);

    readonly expanded = model(false);

    readonly active = linkedSignal({
        source: () => ({ expanded: this.expanded(), options: this.select.options() }),
        computation: ({ expanded, options }) => expanded ? options.at(0) : undefined
    });

    constructor() {
        this.element.id ||= `ngx-popup-${id++}`;
        const positionAnchor = `--${this.element.id}`;
        if (!getComputedStyle(this.element).positionAnchor) this.element.style.setProperty('position-anchor', '--' + positionAnchor);
        if (this.element instanceof HTMLDialogElement) !this.element.getAttribute('closedby') && this.element.setAttribute('closedby', 'any');
        else this.element.popover = 'auto';
    }

    protected onClose(): void {
        if (!this.select.multi()) this.element instanceof HTMLDialogElement ? this.element.close() : this.element.hidePopover();
    }

    protected onSelect(event: KeyboardEvent): void {
        const options = this.select.options();
        switch (event.code) {
            case 'ArrowDown':
                event.preventDefault();
                this.active.update((active) => {
                    const index = options.indexOf(active!);
                    for (let i = index + 1; i !== index; ++i) {
                        if (i >= options.length) i = -1;
                        else if (options.at(i)?.disabled()) continue;
                        else return options.at(i);
                    } return undefined;
                });
                this.element.ariaActiveDescendantElement = this.active()?.element || null;
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.active.update((active) => {
                    const index = options.indexOf(active!);
                    for (let i = index - 1; i !== index; --i) {
                        if (i < 0) i = options.length;
                        else if (options.at(i)?.disabled()) continue;
                        else return options.at(i);
                    } return undefined;
                });
                this.element.ariaActiveDescendantElement = this.active()?.element || null;
                break;
            case 'Enter':
                event.preventDefault();
                const option = this.active();
                if (option && !option.disabled()) this.select.toggle(option.value());
                this.onClose();
                break;
        }
    }

    protected onToggle(event: ToggleEvent): void {
        this.expanded.set(event.newState === 'open');
        this.expanded() ? this.element.focus() : this.element.blur();
        this.element.ariaActiveDescendantElement = this.expanded() ? this.select.options().at(0)?.element || null : null;
        if (!this.expanded()) this.select.onTouched();
    }
}
