import { DelayedTab } from '@types';

export default function normalizeDelayedTabs(tabs: DelayedTab[]): DelayedTab[] {
  return tabs.map((tab) => ({
    ...tab,
    id: String(tab.id),
  }));
}
