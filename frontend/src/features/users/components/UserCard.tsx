import { MobileEntityCard } from '@/components';
import type { CardComponentProps } from '@/components';
import { Badge } from '@/components/primitives/Badge';
import { TYPE } from '@/components/theme/recipes';
import { USER_ROLE_CONFIG, type UserRole } from '@/types';
import { resolveStatusBadgeColor } from '@/utils/statusBadge';
import type { UserAdminRecord } from '../api/usersAdmin';

/**
 * Mobile card for the user management table.
 */
export function UserCard({ item, onClick }: CardComponentProps<UserAdminRecord>) {
  const role = item.role as UserRole;
  return (
    <MobileEntityCard onClick={onClick}>
      <MobileEntityCard.Header
        leading={
          <div className="flex min-w-0 flex-col">
            <div className={`${TYPE.amount} truncate`}>{item.name}</div>
            <div className={`${TYPE.meta} truncate`}>{item.username}</div>
          </div>
        }
        trailing={
          <Badge variant={resolveStatusBadgeColor(role)} size="xs">
            {USER_ROLE_CONFIG[role]?.label ?? role}
          </Badge>
        }
      />
      {item.email ? <div className={TYPE.label}>{item.email}</div> : null}
    </MobileEntityCard>
  );
}
