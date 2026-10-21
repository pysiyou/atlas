/**
 * User management table columns.
 */
import { Badge } from '@/components/primitives/Badge';
import type { TableViewConfig } from '@/components/data-table';
import {
  buildViews,
  createBadgeColumn,
  createDateTimeColumn,
  TABLE_COLUMN_WIDTH,
} from '@/components/data-table';
import { Text } from '@/components/layout/Text';
import { USER_ROLE_CONFIG, type UserRole } from '@/types';
import { resolveStatusBadgeColor } from '@/utils/statusBadge';
import type { UserAdminRecord } from '../api/usersAdmin';
import { UserCard } from '../components/UserCard';
import { isUserActive } from '../utils/userAccountGuards';

const USER_VIEWS = {
  full: ['name', 'username', 'role', 'status', 'email', 'lastLogin', 'created'],
  medium: ['name', 'username', 'role', 'status', 'lastLogin'],
  compact: ['name', 'role', 'status'],
} as const;

export function createUserTableConfig(): TableViewConfig<UserAdminRecord> {
  const columnMap = {
    name: {
      key: 'name',
      header: 'Name',
      width: TABLE_COLUMN_WIDTH.flex,
      sortable: true,
      truncate: true,
      accessor: (user: UserAdminRecord) => user.name,
      render: (user: UserAdminRecord) => (
        <Text role="body" truncate className="font-normal">{user.name}</Text>
      ),
    },
    username: {
      key: 'username',
      header: 'Username',
      width: TABLE_COLUMN_WIDTH.username,
      sortable: true,
      accessor: (user: UserAdminRecord) => user.username,
      render: (user: UserAdminRecord) => (
        <Text role="label" truncate className="font-normal">{user.username}</Text>
      ),
    },
    role: createBadgeColumn<UserAdminRecord>(
      'role',
      'Role',
      user => {
        const role = user.role as UserRole;
        return (
          <Badge variant={resolveStatusBadgeColor(role)} size="xs">
            {USER_ROLE_CONFIG[role]?.label ?? role}
          </Badge>
        );
      },
      {
        sortable: true,
        width: TABLE_COLUMN_WIDTH.badgeWide,
        accessor: user => user.role,
      }
    ),
    status: createBadgeColumn<UserAdminRecord>(
      'status',
      'Status',
      user => {
        const active = isUserActive(user);
        return (
          <Badge variant={active ? 'success' : 'neutral'} size="xs">
            {active ? 'Active' : 'Disabled'}
          </Badge>
        );
      },
      {
        sortable: true,
        accessor: user => (isUserActive(user) ? 'active' : 'disabled'),
      }
    ),
    email: {
      key: 'email',
      header: 'Email',
      width: TABLE_COLUMN_WIDTH.email,
      sortable: true,
      accessor: (user: UserAdminRecord) => user.email ?? '',
      render: (user: UserAdminRecord) => (
        <Text role="body" intent="muted" truncate className="font-normal">{user.email ?? '—'}</Text>
      ),
    },
    lastLogin: createDateTimeColumn<UserAdminRecord>(
      'lastLogin',
      'Last Login',
      user => user.loggedInAt
    ),
    created: createDateTimeColumn<UserAdminRecord>('created', 'Created', user => user.createdAt),
  };

  return {
    ...buildViews(columnMap, USER_VIEWS),
    CardComponent: UserCard,
  };
}
