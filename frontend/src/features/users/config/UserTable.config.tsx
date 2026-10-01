/**
 * User management table columns.
 */
import { Badge } from '@/components/primitives/Badge';
import type { TableViewConfig } from '@/components';
import { buildViews } from '@/components/data-table';
import { TABLE_TYPE } from '@/components/theme/recipes';
import { USER_ROLE_CONFIG, type UserRole } from '@/types';
import { resolveStatusBadgeColor } from '@/utils/statusBadge';
import type { UserAdminRecord } from '../api/usersAdmin';
import { UserCard } from '../components/UserCard';

const USER_VIEWS = {
  full: ['name', 'username', 'role', 'email'],
  medium: ['name', 'username', 'role'],
  compact: ['name', 'role'],
} as const;

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
  };

  return {
    ...buildViews(columnMap, USER_VIEWS),
    CardComponent: UserCard,
  };
}
