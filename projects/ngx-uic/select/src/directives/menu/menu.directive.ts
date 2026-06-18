import { Directive, ElementRef, inject } from '@angular/core';
import { NgxSelectComponent } from '../../components/select/select.component';

let id = 0;

@Directive({
    selector: '[ngxMenu]',
    host: { '(click)': 'onClose()' },
    exportAs: 'ngxMenu'
})
export class NgxMenuDirective {
    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private select = inject(NgxSelectComponent);

    constructor() {
        this.element.id ||= `ngx-menu-${id++}`;
        if (this.element instanceof HTMLDialogElement) {
            const positionAnchor = `--${this.element.id}`;
            if (!getComputedStyle(this.element).positionAnchor) this.element.style.setProperty('position-anchor', '--' + positionAnchor);
            if (!this.element.getAttribute('closedby')) this.element.setAttribute('closedby', 'any');
        } else this.element.popover = 'auto';
    }

    onClose(): void {
        if (!this.select.multi()) this.element instanceof HTMLDialogElement
            ? this.element.close()
            : this.element.hidePopover();
    }
}
