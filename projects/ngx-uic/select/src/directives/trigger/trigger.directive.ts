import { Directive, ElementRef, effect, inject } from '@angular/core';
import { NgxSelectComponent } from '../../components/select/select.component';

@Directive({
    selector: '[ngxTrigger]',
    exportAs: 'ngxTrigger',
    host: {
        'tabindex': '0',
        '(click)': 'onOpen()',
        '(keypress)': 'onOpen($event)'
    }
})
export class NgxTriggerDirective {
    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private select = inject(NgxSelectComponent);

    private bind$ = effect(() => {
        const popup = this.select.popup().element;
        const positionAnchor = getComputedStyle(popup).positionAnchor;
        if (getComputedStyle(this.element).anchorName !== positionAnchor) this.element.style.setProperty('anchor-name', positionAnchor);
        if (popup instanceof HTMLDialogElement) {
            if (!this.element.getAttribute('command')) this.element.setAttribute('command', 'show-modal');
            if (!this.element.getAttribute('commandfor')) this.element.setAttribute('commandfor', popup.id);
        } else if(!this.element.getAttribute('popovertarget')) this.element.setAttribute('popovertarget', popup.id);
    });

    protected onOpen(event?: KeyboardEvent): void {
        if (event && event.code !== 'Enter') return;
        if (this.element instanceof HTMLButtonElement) return;
        if (this.element instanceof HTMLInputElement && this.element.type === 'button') return;
        const popup = this.select.popup().element;
        if (!this.select.popup().expanded()) popup instanceof HTMLDialogElement ? popup.showModal() : popup.showPopover();
    }
}
