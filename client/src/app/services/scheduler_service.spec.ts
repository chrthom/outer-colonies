import { TestBed } from '@angular/core/testing';
import { SchedulerService } from './scheduler_service';

describe('SchedulerService', () => {
  let service: SchedulerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SchedulerService);
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('executes the scheduled callback after the requested delay', () => {
    const callback = jasmine.createSpy('callback');

    service.schedule(250, callback);
    jasmine.clock().tick(249);
    expect(callback).not.toHaveBeenCalled();

    jasmine.clock().tick(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('cancels the pending callback when the returned cancel function is called', () => {
    const callback = jasmine.createSpy('callback');

    const cancel = service.schedule(250, callback);
    cancel();
    jasmine.clock().tick(300);

    expect(callback).not.toHaveBeenCalled();
  });
});
