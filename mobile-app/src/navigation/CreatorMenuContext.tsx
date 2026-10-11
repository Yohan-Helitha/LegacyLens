import { createContext, useContext } from 'react';

/**
 * What the creator side menu needs beyond its original three entries. It is supplied once by
 * CreatorNavigator and read by the menu itself, so the screens that show the menu do not each
 * have to pass it down. Without a provider the "Rejected Applications" entry is simply not shown.
 */
export interface CreatorMenuValue {
  /** How many of the creator's applications have been rejected - the red number on the menu. */
  rejectedApplicationsCount: number;
  onOpenRejectedApplications: (() => void) | null;
}

export const CreatorMenuContext = createContext<CreatorMenuValue>({
  rejectedApplicationsCount: 0,
  onOpenRejectedApplications: null,
});

export const useCreatorMenu = () => useContext(CreatorMenuContext);
