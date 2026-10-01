/**
 * User management — directory plus system event log (login, user, catalog).
 */
import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { actionButtonPreset, Button, DataTable, ErrorAlert, PageHeader } from '@/components';
import { PANEL, WORKSPACE } from '@/components/theme/recipes';
import { useAuthStore } from '@/app/authStore';
import { ROUTES } from '@/config';
import { SystemEventLogPanel } from '@/features/audit';
import { errorAlertMessage } from '@/utils/feedback';
import { useUsersAdminList, type UserAdminRecord } from '../api/usersAdmin';
import { UserUpsertModal } from '../components/UserUpsertModal';
import { createUserTableConfig } from '../config/UserTable.config';

/**
 * Administrator-only users page with SystemEventLogPanel.
 */
export const UsersPage: React.FC = () => {
  const { hasRole } = useAuthStore();
  const { users, isLoading, isError, error, refetch } = useUsersAdminList();
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
      <div className={WORKSPACE.page}>
        <PageHeader
          variant="bar"
          title="User management"
          actions={
            <Button {...actionButtonPreset('add')} size="sm" onClick={openCreate}>
              New user
            </Button>
          }
        />
        {listError ? (
          <ErrorAlert error={listError} onRetry={refetch} className="shrink-0" />
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col gap-workspace-page-gap lg:flex-row">
          <div className={`${PANEL.raisedShadowSm} flex min-h-0 flex-1 flex-col overflow-hidden`}>
            <DataTable
              data={users}
              viewConfig={tableConfig}
              loading={isLoading}
              embedded
              striped
              onRowClick={openEdit}
              ariaLabel="Users"
            />
          </div>
          <div className={`${PANEL.raisedShadowSm} flex min-h-0 flex-1 flex-col overflow-hidden`}>
            <SystemEventLogPanel layout="embedded" className="min-h-0 h-full" />
          </div>
        </div>
      </div>
      {isModalOpen ? (
        <UserUpsertModal
          key={selectedUser?.id ?? 'create'}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          user={selectedUser}
        />
      ) : null}
    </div>
  );
};
