import { Directive, ElementRef, effect, inject, model } from '@angular/core';
import { NgxSelectComponent } from '../../components/select/select.component';

let id = 0;

@Directive({
    selector: '[ngxPopup]',
    exportAs: 'ngxPopup',
    host: {
        'tabindex': '0',
        '(click)': 'onClose()',
        '(keypress)': 'onClose($event)',
        '(toggle)': 'expanded.set($event.newState === "open")'
    },
})
export class NgxPopupDirective {
    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private select = inject(NgxSelectComponent);
    
    readonly expanded = model(false);

    private toggle$ = effect((onCleanup) => {
        this.expanded() ? this.element.focus() : this.element.blur();
        onCleanup(() => !this.expanded() && this.select.onTouched());
    });

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
}
