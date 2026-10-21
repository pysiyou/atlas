/**
 * User management table columns.
 */
import { Badge } from '@/components/primitives/Badge';
import type { TableViewConfig } from '@/components/data-table';
import {
  buildViews,
  COLUMN_SIZE,
  createDateTimeColumn,
  TABLE_COLUMN_WIDTH,
} from '@/components/data-table';
import { TABLE_TYPE } from '@/components/theme/recipes';
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

/**
 * Build the user directory table config.
 */
export function createUserTableConfig(): TableViewConfig<UserAdminRecord> {
  const columnMap = {
    name: {
      key: 'name',
      header: 'Name',
      width: COLUMN_SIZE.fill,
      sortable: true,
      truncate: true,
      accessor: (user: UserAdminRecord) => user.name,
      render: (user: UserAdminRecord) => (
        <div className={`${TABLE_TYPE.cell} truncate font-normal`}>{user.name}</div>
      ),
    },
    username: {
      key: 'username',
      header: 'Username',
      width: COLUMN_SIZE.md,
      sortable: true,
      accessor: (user: UserAdminRecord) => user.username,
      render: (user: UserAdminRecord) => (
        <div className={`${TABLE_TYPE.secondary} truncate font-normal`}>{user.username}</div>
      ),
    },
    role: {
      key: 'role',
      header: 'Role',
      width: TABLE_COLUMN_WIDTH.badgeWide,
      sortable: true,
      accessor: (user: UserAdminRecord) => user.role,
      render: (user: UserAdminRecord) => {
        const role = user.role as UserRole;
        return (
          <Badge variant={resolveStatusBadgeColor(role)} size="xs">
            {USER_ROLE_CONFIG[role]?.label ?? role}
          </Badge>
        );
      },
    },
    status: {
      key: 'status',
      header: 'Status',
      width: TABLE_COLUMN_WIDTH.badge,
      sortable: true,
      accessor: (user: UserAdminRecord) => (isUserActive(user) ? 'active' : 'disabled'),
      render: (user: UserAdminRecord) => {
        const active = isUserActive(user);
        return (
          <Badge variant={active ? 'success' : 'neutral'} size="xs">
            {active ? 'Active' : 'Disabled'}
          </Badge>
        );
      },
    },
    email: {
      key: 'email',
      header: 'Email',
      width: COLUMN_SIZE.lg,
      sortable: true,
      accessor: (user: UserAdminRecord) => user.email ?? '',
      render: (user: UserAdminRecord) => (
        <div className={`${TABLE_TYPE.meta} truncate font-normal`}>{user.email ?? '—'}</div>
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
