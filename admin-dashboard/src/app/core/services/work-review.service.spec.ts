import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { WorkReviewService } from './work-review.service';

describe('WorkReviewService', () => {
  let service: WorkReviewService;
  let http: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(WorkReviewService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the queue from the admin endpoint and unwraps the envelope', () => {
    let result: unknown;
    service.list().subscribe((items) => (result = items));

    const req = http.expectOne(`${base}/admin/work-review`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [{ jobId: 'j1' }] });
    expect(result).toEqual([{ jobId: 'j1' }] as any);
  });

  it('returns an empty queue when the server sends no data', () => {
    let result: unknown;
    service.list().subscribe((items) => (result = items));
    http.expectOne(`${base}/admin/work-review`).flush({ success: true });
    expect(result).toEqual([]);
  });

  it('declines by posting the trimmed reason as the feedback message', () => {
    service.decline('j1', '  needs a clearer photo  ').subscribe();

    const req = http.expectOne(`${base}/admin/work-feedback/jobs/j1`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ message: 'needs a clearer photo' });
    req.flush({ data: {} });
  });

  it('approves and publishes through their own endpoints', () => {
    service.approve('j1').subscribe();
    service.publish('j1').subscribe();

    http.expectOne(`${base}/admin/work-feedback/jobs/j1/approve`).flush({ data: {} });
    http.expectOne(`${base}/admin/work-feedback/jobs/j1/publish`).flush({ data: {} });
  });
});
