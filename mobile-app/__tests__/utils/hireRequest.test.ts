import { toHireDisplayStatus } from '../../src/utils/hireRequest';

describe('toHireDisplayStatus', () => {
  it('maps backend statuses onto Screen 9 statuses', () => {
    expect(toHireDisplayStatus('PENDING_ADMIN_REVIEW', 0)).toBe('PENDING_REVIEW');
    expect(toHireDisplayStatus('REJECTED', 0)).toBe('NOT_APPROVED');
    expect(toHireDisplayStatus('CLOSED', 3)).toBe('ASSIGNED');
  });

  it('splits PUBLISHED into Open vs Reviewing on applicant count', () => {
    expect(toHireDisplayStatus('PUBLISHED', 0)).toBe('OPEN');
    expect(toHireDisplayStatus('PUBLISHED', 1)).toBe('REVIEWING');
    expect(toHireDisplayStatus('PUBLISHED', 7)).toBe('REVIEWING');
  });

  it('hides drafts', () => {
    expect(toHireDisplayStatus('DRAFT', 0)).toBeNull();
  });
});
