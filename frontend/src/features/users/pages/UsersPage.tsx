/**
 * Administrator-only user directory — create, edit, disable, and assign roles.
 */
import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { actionButtonPreset, Button, ListView } from '@/components';
import { useAuthStore } from '@/app/authStore';
import { ROUTES } from '@/config';
import { errorAlertMessage } from '@/utils/feedback';
import { useUsersAdminList, type UserAdminRecord } from '../api/usersAdmin';
import { UserFilters } from '../components/UserFilters';
import { UserUpsertModal } from '../components/UserUpsertModal';
import { createUserTableConfig } from '../config/UserTable.config';
import { useUsersFilters } from '../hooks/useUsersFilters';
import { isUserActive } from '../utils/userAccountGuards';

/**
 * Administrator-only users page with searchable directory and account actions.
 */
export const UsersPage: React.FC = () => {
  const { hasRole, user: currentUser } = useAuthStore();
  const { users, isLoading, isError, error, refetch } = useUsersAdminList();
  const {
    filteredUsers,
    searchQuery,
    setSearchQuery,
    roleFilters,
    setRoleFilters,
    statusFilters,
    setStatusFilters,
  } = useUsersFilters({ users });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAdminRecord | null>(null);
  const tableConfig = useMemo(() => createUserTableConfig(), []);

  if (!hasRole('administrator')) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  const listError = isError
    ? { message: errorAlertMessage('users.list.loadFailed', error), operation: 'load' as const }
    : null;

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
        filters={
          <UserFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            roleFilters={roleFilters}
            onRoleFiltersChange={setRoleFilters}
            statusFilters={statusFilters}
            onStatusFiltersChange={setStatusFilters}
          />
        }
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
