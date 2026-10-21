/**
 * Create or edit a user account (administrator).
 */
import React, { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { actionButtonPreset, Button } from '@/components/primitives';
import { Alert, FooterInfo } from '@/components/display';
import { FormDialogFooter, Modal, ModalPageShell } from '@/components/overlays';
import { MODULE_ICONS } from '@/config/icons';
import type { UserAdminRecord } from '../api/usersAdmin';
import { useUserUpsertForm } from '../hooks/useUserUpsertForm';
import { useUserUpsertSubmit } from '../hooks/useUserUpsertSubmit';
import {
  canDisableUser,
  isLastActiveAdministrator,
  isUserActive,
} from '../utils/userAccountGuards';
import { UserUpsertFormFields } from './UserUpsertFormFields';

const FORM_ID = 'user-upsert-form';

export interface UserUpsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAdminRecord | null;
  users: UserAdminRecord[];
  currentUserId: number | null;
}

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

export const UserUpsertModal: React.FC<UserUpsertModalProps> = ({
  isOpen,
  onClose,
  user,
  users,
  currentUserId,
}) => {
  const isEdit = user != null;
  const form = useUserUpsertForm(user);
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
  const draftName = form.watch('name')?.trim() ?? '';
  const modalTitle = isEdit && user ? draftName || user.name : 'New user';
  const modalSubtitle = confirmingDisable
    ? 'Disable this account?'
    : isEdit
      ? 'Edit user'
      : 'Set credentials and profile details for the new account.';

  return (
    <Modal
      isOpen={isOpen}
      onClose={confirmingDisable ? () => setConfirmingDisable(false) : onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      size="2xl"
      disableClose={isSubmitting}
    >
      <ModalPageShell
        bodyPadding="form"
        footer={
          <FormDialogFooter
            formId={FORM_ID}
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
        }
      >
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
          <FormProvider {...form}>
            <UserUpsertFormFields
              formId={FORM_ID}
              isEdit={isEdit}
              user={user}
              roleLocked={lastActiveAdmin}
              onSubmit={handleSubmit}
            />
          </FormProvider>
        )}
      </ModalPageShell>
    </Modal>
  );
};
