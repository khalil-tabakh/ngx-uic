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
        const menu = this.select.menu().element;
        if (menu instanceof HTMLDialogElement) {
            const positionAnchor = getComputedStyle(menu).positionAnchor;
            if (getComputedStyle(this.element).anchorName !== positionAnchor) this.element.style.setProperty('anchor-name', positionAnchor);
            if (!this.element.getAttribute('command')) this.element.setAttribute('command', 'show-modal');
            if (!this.element.getAttribute('commandfor')) this.element.setAttribute('commandfor', menu.id);
        } else if(!this.element.getAttribute('popovertarget')) this.element.setAttribute('popovertarget', menu.id);
    });
}
