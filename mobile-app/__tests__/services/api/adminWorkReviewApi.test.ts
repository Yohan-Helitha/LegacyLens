const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock('../../../src/services/api/client', () => ({
  apiGet: (...args: unknown[]) => mockGet(...args),
  apiPost: (...args: unknown[]) => mockPost(...args),
}));

import { adminWorkReviewApi } from '../../../src/services/api/adminWorkReviewApi';

describe('adminWorkReviewApi', () => {
  beforeEach(() => {
    mockGet.mockReset().mockResolvedValue([]);
    mockPost.mockReset().mockResolvedValue({});
  });

  it('reads the admin queue, one submission and both reviewers\' state from the admin endpoints', async () => {
    await adminWorkReviewApi.list();
    await adminWorkReviewApi.get('job-1');
    await adminWorkReviewApi.getFeedback('job-1');
    expect(mockGet).toHaveBeenNthCalledWith(1, '/admin/work-review');
    expect(mockGet).toHaveBeenNthCalledWith(2, '/admin/work-review/jobs/job-1');
    expect(mockGet).toHaveBeenNthCalledWith(3, '/admin/work-feedback/jobs/job-1');
  });

  it('approves and publishes with no body', async () => {
    await adminWorkReviewApi.approve('job-1');
    await adminWorkReviewApi.publish('job-1');
    expect(mockPost).toHaveBeenNthCalledWith(1, '/admin/work-feedback/jobs/job-1/approve', undefined);
    expect(mockPost).toHaveBeenNthCalledWith(2, '/admin/work-feedback/jobs/job-1/publish', undefined);
  });

  it('declines by sending the written reason as the feedback message', async () => {
    await adminWorkReviewApi.decline('job-1', 'The photo is too dark');
    expect(mockPost).toHaveBeenCalledWith('/admin/work-feedback/jobs/job-1', { message: 'The photo is too dark' });
  });
});
