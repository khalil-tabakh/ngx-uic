import { TestBed } from '@angular/core/testing';

import { NgxUicService } from './ngx-uic.service';

describe('NgxUicService', () => {
  let service: NgxUicService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxUicService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
