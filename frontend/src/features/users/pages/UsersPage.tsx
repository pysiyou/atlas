/**
 * Administrator-only user directory — create, edit, disable, and assign roles.
 */
import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { actionButtonPreset, Button } from '@/components/primitives';
import { ListView } from '@/components/surfaces';
import { useAuthStore } from '@/app/authStore';
import { ROUTES } from '@/config';
import { toListLoadError } from '@/hooks/listPage';
import { applyPageFilters, usePageFilters } from '@/hooks/usePageFilters';
import { useUsersAdminList, type UserAdminRecord } from '../api/usersAdmin';
import { UserFilters } from '../components/UserFilters';
import { UserUpsertModal } from '../components/UserUpsertModal';
import { createUserTableConfig } from '../config/UserTable.config';
import { filterUsers, usersListInitialFilters } from '../utils/filterUsers';
import { isUserActive } from '../utils/userAccountGuards';

export const UsersPage: React.FC = () => {
  const { hasRole, user: currentUser } = useAuthStore();
  const { users, isLoading, isError, error, refetch } = useUsersAdminList();
  const { filters, setFilter } = usePageFilters({
    initialFilters: usersListInitialFilters,
  });
  const filteredUsers = useMemo(
    () => applyPageFilters(users, filters, filterUsers),
    [users, filters],
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAdminRecord | null>(null);
  const tableConfig = useMemo(() => createUserTableConfig(), []);

  if (!hasRole('administrator')) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  const listError = isError ? toListLoadError('users.list.loadFailed', error) : null;

  const openCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const openEdit = (user: UserAdminRecord) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ListView
        items={filteredUsers}
        viewConfig={tableConfig}
        loading={isLoading}
        error={listError}
        onRetry={refetch}
        onDismissError={() => undefined}
        onRowClick={openEdit}
        title="User management"
        headerActions={
          <Button {...actionButtonPreset('add')} size="sm" onClick={openCreate}>
            New user
          </Button>
        }
        filters={<UserFilters filters={filters} setFilter={setFilter} />}
        pagination={{ mode: 'client', pageSize: 20 }}
        defaultSort={{ key: 'name', direction: 'asc' }}
        rowClassName={user => (isUserActive(user) ? '' : 'opacity-60')}
        ariaLabel="Users"
      />
      {isModalOpen ? (
        <UserUpsertModal
          key={selectedUser?.id ?? 'create'}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          user={selectedUser}
          users={users}
          currentUserId={currentUser?.id ?? null}
        />
      ) : null}
    </div>
  );
};
