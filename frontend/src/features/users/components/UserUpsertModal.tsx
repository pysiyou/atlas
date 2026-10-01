/**
 * Create or edit a user account (administrator).
 */
import React, { useState } from 'react';
import { FooterInfo, FormDialogFooter, Input, Modal, Select } from '@/components';
import { MODULE_ICONS } from '@/config/icons';
import { USER_ROLE_OPTIONS, type UserRole } from '@/types';
import { notify } from '@/utils/feedback';
import type { UserAdminRecord } from '../api/usersAdmin';
import { useCreateUser, useUpdateUser } from '../api/usersAdmin';

const FORM_ID = 'user-upsert-form';

export interface UserUpsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAdminRecord | null;
}

interface UserFormState {
  username: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  password: string;
}

const EMPTY_FORM: UserFormState = {
  username: '',
  name: '',
  role: 'receptionist',
  email: '',
  phone: '',
  password: '',
};

function formFromUser(user: UserAdminRecord | null): UserFormState {
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
 * Modal form for creating and updating users.
 * Remount from the parent with a key when the target user changes.
 */
export const UserUpsertModal: React.FC<UserUpsertModalProps> = ({ isOpen, onClose, user }) => {
  const isEdit = user != null;
  const [form, setForm] = useState<UserFormState>(() => formFromUser(user));
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isSubmitting = createUser.isPending || updateUser.isPending;

  const modalTitle = isEdit && user ? form.name.trim() || user.name : 'New user';
  const modalSubtitle = isEdit ? 'Edit user' : 'Set credentials and profile details for the new account.';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    const username = form.username.trim();
    if (!name || (!isEdit && !username)) return;

    if (isEdit && user) {
      updateUser.mutate(
        {
          userId: user.id,
          body: {
            name,
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
            password: form.password.trim() || undefined,
          },
        },
        {
          onSuccess: () => {
            notify.toast('users.update.success');
            onClose();
          },
          onError: error => notify.apiError('users.update.error', error),
        }
      );
      return;
    }

    if (!form.password.trim()) return;

    createUser.mutate(
      {
        username,
        name,
        role: form.role,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        password: form.password,
      },
      {
        onSuccess: () => {
          notify.toast('users.create.success');
          onClose();
        },
        onError: error => notify.apiError('users.create.error', error),
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      size="md"
      disableClose={isSubmitting}
    >
      <div className="flex flex-col h-full bg-surface-page">
        <div className="flex-1 overflow-y-auto px-table-cell-x-default py-space-5">
          <form id={FORM_ID} className="flex flex-col gap-space-4" onSubmit={handleSubmit}>
            <Input
              label="Name"
              name="name"
              required
              value={form.name}
              onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
            />
            <Input
              label="Username"
              name="username"
              required={!isEdit}
              disabled={isEdit}
              value={form.username}
              onChange={event => setForm(prev => ({ ...prev, username: event.target.value }))}
            />
            {!isEdit ? (
              <Select
                label="Role"
                name="role"
                required
                value={form.role}
                options={USER_ROLE_OPTIONS}
                onChange={event =>
                  setForm(prev => ({ ...prev, role: event.target.value as UserRole }))
                }
              />
            ) : null}
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={event => setForm(prev => ({ ...prev, email: event.target.value }))}
            />
            <Input
              label="Phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={event => setForm(prev => ({ ...prev, phone: event.target.value }))}
            />
            <Input
              label={isEdit ? 'New password' : 'Password'}
              name="password"
              type="password"
              required={!isEdit}
              value={form.password}
              onChange={event => setForm(prev => ({ ...prev, password: event.target.value }))}
              helperText={isEdit ? 'Leave blank to keep the current password' : undefined}
            />
          </form>
        </div>
        <FormDialogFooter
          formId={FORM_ID}
          onClose={onClose}
          submitLabel={isEdit ? 'Save changes' : 'Create user'}
          isSubmitting={isSubmitting}
          footerInfo={<FooterInfo icon={MODULE_ICONS.users} label="Users" size="md" />}
        />
      </div>
    </Modal>
  );
};
