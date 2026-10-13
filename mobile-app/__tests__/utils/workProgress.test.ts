import { deriveProgress, stepFlags } from '../../src/types/workProgress';
import type { ChecklistItemResponse } from '../../src/types/workProgress';

function prep(completed: boolean): ChecklistItemResponse {
  return { id: `prep-${Math.random()}`, stage: 'PREP', completed } as ChecklistItemResponse;
}

const none = { recordDone: false, editDone: false, submitted: false };

describe('deriveProgress', () => {
  it('shares one quarter between the Prep tasks, however many there are', () => {
    const result = deriveProgress([prep(true), prep(true), prep(false), prep(false)], none);
    expect(result.percentage).toBe(13);
    expect(result.prepDone).toBe(false);
    expect(result.stage).toBe('PREP');
  });

  it('moves to Record once every Prep task is done', () => {
    const result = deriveProgress([prep(true)], none);
    expect(result).toMatchObject({ percentage: 25, prepDone: true, stage: 'RECORD' });
  });

  it('counts a job with no Prep tasks as past Prep', () => {
    expect(deriveProgress([], none)).toMatchObject({ prepDone: true, percentage: 25, stage: 'RECORD' });
  });

  it('waits at Submit with three quarters done, and is full only after submitting', () => {
    const ready = deriveProgress([prep(true)], { recordDone: true, editDone: true, submitted: false });
    expect(ready).toMatchObject({ percentage: 75, stage: 'SUBMIT' });

    const sent = deriveProgress([prep(true)], { recordDone: true, editDone: true, submitted: true });
    expect(sent).toMatchObject({ percentage: 100, stage: 'COMPLETED' });
  });

  it('shows each circle by its own step, whatever order they were done in', () => {
    const result = deriveProgress([prep(true)], { recordDone: false, editDone: true, submitted: false });
    expect(stepFlags(result)).toEqual([true, false, true, false]);
  });
});
