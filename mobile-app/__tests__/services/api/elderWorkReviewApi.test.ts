const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock('../../../src/services/api/client', () => ({
  apiGet: (...args: unknown[]) => mockGet(...args),
  apiPost: (...args: unknown[]) => mockPost(...args),
}));

import { elderWorkReviewApi } from '../../../src/services/api/elderWorkReviewApi';

describe('elderWorkReviewApi', () => {
  beforeEach(() => {
    mockGet.mockReset().mockResolvedValue([]);
    mockPost.mockReset().mockResolvedValue({});
  });

  it('reads the review queue and one submission from the elder endpoints', async () => {
    await elderWorkReviewApi.list();
    await elderWorkReviewApi.get('job-1');
    expect(mockGet).toHaveBeenNthCalledWith(1, '/elder/work-review');
    expect(mockGet).toHaveBeenNthCalledWith(2, '/elder/work-review/jobs/job-1');
  });

  it('approves with no body', async () => {
    await elderWorkReviewApi.approve('job-1');
    expect(mockPost).toHaveBeenCalledWith('/elder/work-feedback/jobs/job-1/approve', undefined);
  });

  it('declines by sending the written reason as the feedback message', async () => {
    await elderWorkReviewApi.decline('job-1', 'Please add the village name');
    expect(mockPost).toHaveBeenCalledWith('/elder/work-feedback/jobs/job-1', { message: 'Please add the village name' });
  });

  it('rates with a trimmed comment, or with the stars alone when the comment is blank', async () => {
    await elderWorkReviewApi.rate('job-1', 5, '  Lovely work  ');
    await elderWorkReviewApi.rate('job-1', 4, '   ');
    expect(mockPost).toHaveBeenNthCalledWith(1, '/elder/creator-rating/jobs/job-1', { rating: 5, comment: 'Lovely work' });
    expect(mockPost).toHaveBeenNthCalledWith(2, '/elder/creator-rating/jobs/job-1', { rating: 4 });
  });
});
