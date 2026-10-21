import { MobileEntityCard } from '@/components/surfaces';
import type { CardComponentProps } from '@/components/data-table';
import { Badge } from '@/components/primitives/Badge';
import { text } from '@/theme/recipes';
import { USER_ROLE_CONFIG, type UserRole } from '@/types';
import { resolveStatusBadgeColor } from '@/utils/statusBadge';
import type { UserAdminRecord } from '../api/usersAdmin';
import { isUserActive } from '../utils/userAccountGuards';

/**
 * Mobile card for the user management table.
 */
export function UserCard({ item, onClick }: CardComponentProps<UserAdminRecord>) {
  const role = item.role as UserRole;
  const active = isUserActive(item);
  return (
    <MobileEntityCard onClick={onClick} className={active ? undefined : 'opacity-60'}>
      <MobileEntityCard.Header
        leading={
          <div className="flex min-w-0 flex-col">
            <div className={`${text({ role: 'amount' })} truncate`}>{item.name}</div>
            <div className={`${text({ role: 'body', intent: 'muted' })} truncate`}>{item.username}</div>
          </div>
        }
        trailing={
          <div className="flex flex-col items-end gap-space-1">
            <Badge variant={resolveStatusBadgeColor(role)} size="xs">
              {USER_ROLE_CONFIG[role]?.label ?? role}
            </Badge>
            <Badge variant={active ? 'success' : 'neutral'} size="xs">
              {active ? 'Active' : 'Disabled'}
            </Badge>
          </div>
        }
      />
      {item.email ? <div className={text({ role: 'label' })}>{item.email}</div> : null}
    </MobileEntityCard>
  );
}
