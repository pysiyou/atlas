/**
 * User management table columns.
 */
import { Badge } from '@/components/primitives/Badge';
import type { TableViewConfig } from '@/components';
import { buildViews } from '@/components/data-table';
import { TABLE_TYPE } from '@/components/theme/recipes';
import { USER_ROLE_CONFIG, type UserRole } from '@/types';
import { formatDateTime } from '@/utils';
import { resolveStatusBadgeColor } from '@/utils/statusBadge';
import type { UserAdminRecord } from '../api/usersAdmin';
import { UserCard } from '../components/UserCard';
import { isUserActive } from '../utils/userAccountGuards';

const USER_VIEWS = {
  full: ['name', 'username', 'role', 'status', 'email', 'lastLogin', 'created'],
  medium: ['name', 'username', 'role', 'status', 'lastLogin'],
  compact: ['name', 'role', 'status'],
} as const;

function formatUserTimestamp(value: string | null | undefined): string {
  return formatDateTime(value) || '—';
}

/**
 * Build the user directory table config.
 */
export function createUserTableConfig(): TableViewConfig<UserAdminRecord> {
  const columnMap = {
    name: {
      key: 'name',
      header: 'Name',
      width: 'fill' as const,
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
      width: 'md' as const,
      sortable: true,
      accessor: (user: UserAdminRecord) => user.username,
      render: (user: UserAdminRecord) => (
        <div className={`${TABLE_TYPE.secondary} truncate font-normal`}>{user.username}</div>
      ),
    },
    role: {
      key: 'role',
      header: 'Role',
      width: 'lg' as const,
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
      width: 'sm' as const,
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
      width: 'lg' as const,
      sortable: true,
      accessor: (user: UserAdminRecord) => user.email ?? '',
      render: (user: UserAdminRecord) => (
        <div className={`${TABLE_TYPE.meta} truncate font-normal`}>{user.email ?? '—'}</div>
      ),
    },
    lastLogin: {
      key: 'lastLogin',
      header: 'Last Login',
      width: 'lg' as const,
      sortable: true,
      accessor: (user: UserAdminRecord) => user.loggedInAt ?? '',
      render: (user: UserAdminRecord) => (
        <div className={`${TABLE_TYPE.datetime} truncate font-normal`}>
          {formatUserTimestamp(user.loggedInAt)}
        </div>
      ),
    },
    created: {
      key: 'created',
      header: 'Created',
      width: 'lg' as const,
      sortable: true,
      accessor: (user: UserAdminRecord) => user.createdAt,
      render: (user: UserAdminRecord) => (
        <div className={`${TABLE_TYPE.datetime} truncate font-normal`}>
          {formatUserTimestamp(user.createdAt)}
        </div>
      ),
    },
  };

  return {
    ...buildViews(columnMap, USER_VIEWS),
    CardComponent: UserCard,
  };
}
