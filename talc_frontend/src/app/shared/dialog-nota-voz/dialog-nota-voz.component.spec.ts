import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogNotaVozComponent } from './dialog-nota-voz.component';

describe('DialogNotaVozComponent', () => {
  let component: DialogNotaVozComponent;
  let fixture: ComponentFixture<DialogNotaVozComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogNotaVozComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogNotaVozComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
