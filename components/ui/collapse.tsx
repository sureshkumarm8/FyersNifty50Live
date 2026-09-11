/**
 * Collapsible section plumbing for the Cockpit's two heaviest panels.
 *
 * The collapsed/expanded choice is persisted per key: these panels sit at the top
 * of the Cockpit, so a preference that reset on every reload would be worse than
 * no preference at all.
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';

export function useCollapsed(key: string, defaultCollapsed = false): [boolean, () => void] {
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? defaultCollapsed : raw === 'true';
    } catch {
      return defaultCollapsed;
    }
  });

  const toggle = React.useCallback(() => {
    setCollapsed(prev => {
      try {
        localStorage.setItem(key, String(!prev));
      } catch {
        /* storage disabled — the choice still holds for this session */
      }
      return !prev;
    });
  }, [key]);

  return [collapsed, toggle];
}

/** The chevron button that flips a section open and shut. */
export const CollapseToggle: React.FC<{
  collapsed: boolean;
  onToggle: () => void;
  label: string;
}> = ({ collapsed, onToggle, label }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-expanded={!collapsed}
    aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${label}`}
    title={collapsed ? `Expand ${label}` : `Collapse ${label}`}
    className="rounded-lg border border-white/10 p-1 text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
  >
    <ChevronDown
      size={14}
      className={`transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
    />
  </button>
);
