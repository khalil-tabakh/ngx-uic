import { Directive, effect, ElementRef, inject } from '@angular/core';
import { NgxSelectComponent } from '../../components/select/select.component';

@Directive({
    selector: '[ngxTrigger]',
    exportAs: 'ngxTrigger'
})
export class NgxTriggerDirective {
    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private select = inject(NgxSelectComponent);

    private bind$ = effect(() => {
        const popup = this.select.popup().element;
        if (popup instanceof HTMLDialogElement) {
            const positionAnchor = getComputedStyle(popup).positionAnchor;
            if (getComputedStyle(this.element).anchorName !== positionAnchor) this.element.style.setProperty('anchor-name', positionAnchor);
            if (!this.element.getAttribute('command')) this.element.setAttribute('command', 'show-modal');
            if (!this.element.getAttribute('commandfor')) this.element.setAttribute('commandfor', popup.id);
        } else if(!this.element.getAttribute('popovertarget')) this.element.setAttribute('popovertarget', popup.id);
    });
}
