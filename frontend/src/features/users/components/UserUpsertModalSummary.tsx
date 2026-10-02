/**
 * Hero summary for the user upsert modal (create callout or edit identity strip).
 */
import React from 'react';
import { Avatar, Badge, Callout } from '@/components';
import { MODULE_ICONS } from '@/config/icons';
import { ERROR_SURFACE_TYPE, RADIUS, TYPE } from '@/components/theme/recipes';
import { USER_ROLE_CONFIG, type UserRole } from '@/types';
import { resolveStatusBadgeColor } from '@/utils/statusBadge';
import type { UserAdminRecord } from '../api/usersAdmin';
import { formatUserTimestamp } from '../utils/userDisplay';
import { isUserActive } from '../utils/userAccountGuards';

export interface UserUpsertModalSummaryProps {
  isEdit: boolean;
  user: UserAdminRecord | null;
  displayName: string;
}

function AccountMetaItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex min-w-[7.5rem] flex-col gap-space-0-5">
      <span className={`${TYPE.caption} uppercase tracking-wider text-text-tertiary`}>{label}</span>
      <span
        className={
          mono
            ? `${ERROR_SURFACE_TYPE.code} tabular-nums text-text-secondary`
            : `${TYPE.value} tabular-nums text-text-secondary`
        }
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Top-of-modal context: onboarding hint for create, avatar + badges + audit strip for edit.
 */
export const UserUpsertModalSummary: React.FC<UserUpsertModalSummaryProps> = ({
  isEdit,
  user,
  displayName,
}) => {
  if (!isEdit || !user) {
    return (
      <Callout variant="neutral" icon={MODULE_ICONS.users} title="Provision account">
        Pick a unique <span className="font-mono text-text-primary">username</span> (login handle) and
        role. Password is set here once; you can reset or disable the account later from this panel.
      </Callout>
    );
  }

  const role = user.role as UserRole;
  const active = isUserActive(user);

  return (
    <div
      className={`overflow-hidden ${RADIUS.menu} border border-border-default bg-surface`}
    >
      <div className="flex flex-col gap-space-4 p-space-4 sm:flex-row sm:items-center sm:justify-between">
        <Avatar
          primaryText={displayName}
          secondaryText={
            <span className="font-mono tabular-nums">
              @{user.username}
              <span className="text-text-disabled"> · </span>
              uid {user.id}
            </span>
          }
          size="lg"
          primaryTextClassName={TYPE.amount}
          secondaryTextClassName="!text-text-tertiary"
        />
        <div className="flex flex-wrap items-center gap-space-2 sm:justify-end">
          <Badge variant={resolveStatusBadgeColor(role)} size="sm">
            {USER_ROLE_CONFIG[role]?.label ?? role}
          </Badge>
          <Badge variant={active ? 'success' : 'neutral'} size="sm">
            {active ? 'Active' : 'Disabled'}
          </Badge>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-space-6 gap-y-space-3 border-t border-border-subtle bg-surface-page/60 px-space-4 py-space-3">
        <AccountMetaItem label="Created" value={formatUserTimestamp(user.createdAt)} />
        <AccountMetaItem label="Last login" value={formatUserTimestamp(user.loggedInAt)} />
        <AccountMetaItem label="Email" value={user.email?.trim() || '—'} />
      </div>
    </div>
  );
};
