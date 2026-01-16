import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxPlayerComponent } from './player.component';

describe('NgxPlayerComponent', () => {
    let component: NgxPlayerComponent;
    let fixture: ComponentFixture<NgxPlayerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgxPlayerComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(NgxPlayerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
