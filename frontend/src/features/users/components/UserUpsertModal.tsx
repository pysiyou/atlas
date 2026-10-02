/**
 * Create or edit a user account (administrator).
 */
import React, { useState } from 'react';
import {
  actionButtonPreset,
  Alert,
  Button,
  FooterInfo,
  FormDialogFooter,
  Modal,
} from '@/components';
import { MODULE_ICONS } from '@/config/icons';
import type { UserAdminRecord } from '../api/usersAdmin';
import { useUserUpsertSubmit } from '../hooks/useUserUpsertSubmit';
import {
  canDisableUser,
  isLastActiveAdministrator,
  isUserActive,
} from '../utils/userAccountGuards';
import {
  UserUpsertFormFields,
  type UserUpsertFormState,
} from './UserUpsertFormFields';

const FORM_ID = 'user-upsert-form';

export interface UserUpsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAdminRecord | null;
  users: UserAdminRecord[];
  currentUserId: number | null;
}

const EMPTY_FORM: UserUpsertFormState = {
  username: '',
  name: '',
  role: 'receptionist',
  email: '',
  phone: '',
  password: '',
};

function formFromUser(user: UserAdminRecord | null): UserUpsertFormState {
  if (!user) return EMPTY_FORM;
  return {
    username: user.username,
    name: user.name,
    role: user.role,
    email: user.email ?? '',
    phone: user.phone ?? '',
    password: '',
  };
}

/**
 * Disable or enable buttons shown beside Cancel in the edit footer.
 */
function AccountStatusActions({
  allowDisable,
  allowEnable,
  isSubmitting,
  onAskDisable,
  onEnable,
}: {
  allowDisable: boolean;
  allowEnable: boolean;
  isSubmitting: boolean;
  onAskDisable: () => void;
  onEnable: () => void;
}) {
  if (allowDisable) {
    return (
      <Button
        type="button"
        {...actionButtonPreset('delete')}
        size="md"
        layout="icon-text"
        onClick={onAskDisable}
        disabled={isSubmitting}
      >
        Disable
      </Button>
    );
  }
  if (allowEnable) {
    return (
      <Button
        type="button"
        {...actionButtonPreset('approve')}
        size="md"
        layout="icon-text"
        onClick={onEnable}
        disabled={isSubmitting}
        isLoading={isSubmitting}
      >
        Enable
      </Button>
    );
  }
  return null;
}

/**
 * Modal form for creating and updating users, including role and disable/enable.
 * Remount from the parent with a key when the target user changes.
 */
export const UserUpsertModal: React.FC<UserUpsertModalProps> = ({
  isOpen,
  onClose,
  user,
  users,
  currentUserId,
}) => {
  const isEdit = user != null;
  const [form, setForm] = useState<UserUpsertFormState>(() => formFromUser(user));
  const [confirmingDisable, setConfirmingDisable] = useState(false);
  const { isSubmitting, setActive, handleSubmit } = useUserUpsertSubmit({
    user,
    form,
    confirmingDisable,
    onClose,
  });
  const lastActiveAdmin = isEdit && user ? isLastActiveAdministrator(user, users) : false;
  const allowDisable = isEdit && user ? canDisableUser(user, currentUserId, users) : false;
  const allowEnable = isEdit && user ? !isUserActive(user) : false;
  const modalTitle = isEdit && user ? form.name.trim() || user.name : 'New user';
  const modalSubtitle = confirmingDisable
    ? 'Disable this account?'
    : isEdit
      ? 'Edit user'
      : 'Set credentials and profile details for the new account.';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      size="2xl"
      disableClose={isSubmitting}
    >
      <div className="flex flex-col h-full bg-surface-page">
        <div className="flex-1 overflow-y-auto px-table-cell-x-default py-space-5">
          {confirmingDisable && user ? (
            <>
              <Alert
                variant="danger"
                title="Disable account"
                description={`${user.name} will not be able to sign in. Historical records will still show this name.`}
              />
              <form id={FORM_ID} className="hidden" onSubmit={handleSubmit} />
            </>
          ) : (
            <UserUpsertFormFields
              formId={FORM_ID}
              isEdit={isEdit}
              user={user}
              form={form}
              roleLocked={lastActiveAdmin}
              onChange={patch => setForm(prev => ({ ...prev, ...patch }))}
              onSubmit={handleSubmit}
            />
          )}
        </div>
        <FormDialogFooter
          formId={FORM_ID}
          onClose={confirmingDisable ? () => setConfirmingDisable(false) : onClose}
          submitLabel={
            confirmingDisable ? 'Disable account' : isEdit ? 'Save changes' : 'Create user'
          }
          submitVariant={confirmingDisable ? 'danger' : 'save'}
          isSubmitting={isSubmitting}
          leadingActions={
            confirmingDisable ? null : (
              <AccountStatusActions
                allowDisable={allowDisable}
                allowEnable={allowEnable}
                isSubmitting={isSubmitting}
                onAskDisable={() => setConfirmingDisable(true)}
                onEnable={() => setActive(true)}
              />
            )
          }
          footerInfo={<FooterInfo icon={MODULE_ICONS.users} label="Users" size="md" />}
        />
      </div>
    </Modal>
  );
};
