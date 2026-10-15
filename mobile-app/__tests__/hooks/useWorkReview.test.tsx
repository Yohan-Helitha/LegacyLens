import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useWorkReviewList } from '../../src/hooks/useWorkReviewList';
import { useWorkSubmission } from '../../src/hooks/useWorkSubmission';
import type { WorkSubmissionDetail, WorkSubmissionSummary } from '../../src/types/workReview';

jest.mock('../../src/services/api/client', () => ({ ApiError: class ApiError extends Error {}, apiGet: jest.fn(), apiPost: jest.fn() }));

const summary = (jobId: string, state: WorkSubmissionSummary['state']): WorkSubmissionSummary => ({
  jobId,
  title: jobId,
  creatorId: 'c',
  opportunityId: null,
  creatorName: 'Creator',
  elderName: 'Elder',
  category: null,
  submittedAt: '2026-10-01T10:00:00',
  state,
  elderApproved: false,
  adminApproved: false,
  publishedAt: null,
});

describe('useWorkReviewList', () => {
  it('groups the queue by state, including the admin\'s ready-to-publish and published groups', async () => {
    const list = jest.fn().mockResolvedValue([
      summary('a', 'AWAITING_REVIEW'),
      summary('b', 'CHANGES_REQUESTED'),
      summary('c', 'COMPLETED'),
      summary('d', 'PUBLISHED'),
    ]);
    const { result } = renderHook(() => useWorkReviewList(list));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.awaiting.map((i) => i.jobId)).toEqual(['a']);
    expect(result.current.changesRequested.map((i) => i.jobId)).toEqual(['b']);
    expect(result.current.readyToPublish.map((i) => i.jobId)).toEqual(['c']);
    expect(result.current.published.map((i) => i.jobId)).toEqual(['d']);
    expect(result.current.approved.map((i) => i.jobId)).toEqual(['c', 'd']);
  });

  it('shows an error state, not sample data, when the queue cannot be loaded', async () => {
    const list = jest.fn().mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useWorkReviewList(list));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.loadError).toBe(true);
    expect(result.current.items).toEqual([]);
  });
});

describe('useWorkSubmission', () => {
  const detail = (state: WorkSubmissionSummary['state']): WorkSubmissionDetail => ({
    summary: summary('job-1', state),
    brief: null,
    introduction: null,
    story: null,
    seoSummary: null,
    seoKeywords: [],
    materials: [],
    elderFeedback: 'Fix the date',
    elderFeedbackAt: '2026-10-02T09:00:00',
    adminFeedback: null,
    adminFeedbackAt: null,
  });

  it('declines with the trimmed reason through whichever reviewer api it is given, then reloads', async () => {
    const api = {
      get: jest.fn().mockResolvedValue(detail('AWAITING_REVIEW')),
      approve: jest.fn().mockResolvedValue({}),
      decline: jest.fn().mockResolvedValue({}),
    };
    const { result } = renderHook(() => useWorkSubmission('job-1', api));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let outcome: { ok: boolean; error: string } | undefined;
    await act(async () => {
      outcome = await result.current.decline('  needs a clearer photo  ');
    });

    expect(api.decline).toHaveBeenCalledWith('job-1', 'needs a clearer photo');
    expect(outcome).toEqual({ ok: true, error: '' });
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('only publishes when the api offers it, and does not rate through the admin api', async () => {
    const api = {
      get: jest.fn().mockResolvedValue(detail('COMPLETED')),
      approve: jest.fn(),
      decline: jest.fn(),
      publish: jest.fn().mockResolvedValue({}),
    };
    const { result } = renderHook(() => useWorkSubmission('job-1', api));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rating).toBeNull();

    await act(async () => {
      await result.current.publish();
    });
    expect(api.publish).toHaveBeenCalledWith('job-1');
  });
});
