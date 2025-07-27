import { CommonModule } from '@angular/common';
import { Component, ElementRef, input, provideZonelessChangeDetection, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxScrollerComponent } from './scroller.component';
import { batchAttribute, offsetAttribute } from '../../utils/transforms.util';

@Component({
    imports: [CommonModule, NgxScrollerComponent],
    template: `
        <ngx-scroller [batch]="batch()" [items]="items()" [offset]="offset()" [threshold]="threshold()">
            <ng-template let-item>
                <p>{{ item }}</p>
            </ng-template>
        </ngx-scroller>
    `
})
class WrapperComponent {
    readonly batch = input(1, { transform: batchAttribute });
    readonly items = input.required<unknown[]>();
    readonly offset = input(0, { transform: offsetAttribute });
    readonly threshold = input<number | number[]>();

    component = viewChild.required(NgxScrollerComponent);
    elementRef = viewChild.required<NgxScrollerComponent, ElementRef<HTMLElement>>(NgxScrollerComponent, { read: ElementRef });
}

describe('NgxScrollerComponent', () => {
    let component: NgxScrollerComponent;
    let fixture: ComponentFixture<WrapperComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgxScrollerComponent, WrapperComponent],
            providers: [provideZonelessChangeDetection()]
        }).compileComponents();

        fixture = TestBed.createComponent(WrapperComponent);
        component = fixture.componentInstance.component();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });
});
