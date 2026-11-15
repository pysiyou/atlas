/**
 * Create or edit a user account (administrator).
 */
import { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { actionButtonPreset, Button } from '@/components/primitives';
import { Alert, FooterInfo } from '@/components/display';

import { FormDialogFooter, Modal, ModalPageShell } from '@/components/overlays';
import { IconKeys } from '@/icons';
import type { UserAdminRecord } from '../api/usersAdmin';
import { useUserUpsertForm } from '../hooks/useUserUpsertForm';
import { useUserUpsertSubmit } from '../hooks/useUserUpsertSubmit';
import {
  canDisableUser,
  isLastActiveAdministrator,
  isUserActive } from '../utils/userAccountGuards';
import { useModuleListTitles } from '@/strings';
import { UserUpsertFormFields } from './UserUpsertFormFields';
import { UserUpsertModalSummary } from './UserUpsertModalSummary';

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
        size="sm"
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
        size="sm"
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

export function UserUpsertModal({
  isOpen,
  onClose,
  user,
  users,
  currentUserId,
}: UserUpsertModalProps) {
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
  const titles = useModuleListTitles();
  const draftName = form.watch('name')?.trim() ?? '';
  const modalTitle = isEdit && user ? draftName || user.name : titles.newUser;
  const modalSubtitle = confirmingDisable
    ? titles.disableAccountQuestion
    : isEdit
      ? titles.editUser
      : titles.newUserSubtitle;

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
              confirmingDisable
                ? titles.disableAccount
                : isEdit
                  ? titles.saveChanges
                  : titles.createUser
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
            footerInfo={<FooterInfo icon={IconKeys.modules.users} label={titles.users} size="md" />}
          />
        }
      >
        {confirmingDisable && user ? (
          <>
            <Alert
              variant="danger"
              title={titles.disableAccount}
              description={titles.disableAccountBody(user.name)}
            />
            <form id={FORM_ID} className="hidden" onSubmit={handleSubmit} />
          </>
        ) : (
          <FormProvider {...form}>
            <div className="flex flex-col gap-space-6">
              <UserUpsertModalSummary
                isEdit={isEdit}
                user={user}
                displayName={draftName || user?.name || ''}
              />
              <UserUpsertFormFields
              formId={FORM_ID}
              isEdit={isEdit}
              user={user}
              roleLocked={lastActiveAdmin}
              onSubmit={handleSubmit}
              />
            </div>
          </FormProvider>
        )}
      </ModalPageShell>
    </Modal>
  );
}
