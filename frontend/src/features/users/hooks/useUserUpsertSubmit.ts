/**
 * Create/update/disable mutations for the user upsert modal.
 */
import { useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { notify } from '@/utils/feedback';
import type { UserAdminRecord } from '../api/usersAdmin';
import { useCreateUser, useUpdateUser } from '../api/usersAdmin';
import type { UserUpsertFormInput } from '../schemas/userUpsertFormSchema';

interface UseUserUpsertSubmitOptions {
  user: UserAdminRecord | null;
  form: UseFormReturn<UserUpsertFormInput>;
  confirmingDisable: boolean;
  onClose: () => void;
}

/**
 * Submit handlers for creating, updating, and toggling account active state.
 */
export function useUserUpsertSubmit({
  user,
  form,
  confirmingDisable,
  onClose,
}: UseUserUpsertSubmitOptions) {
  const isEdit = user != null;
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isSubmitting = createUser.isPending || updateUser.isPending;

  const setActive = useCallback(
    (isActive: boolean) => {
      if (!user) return;
      updateUser.mutate(
        { userId: user.id, body: { isActive } },
        {
          onSuccess: () => {
            notify.toast(isActive ? 'users.enable.success' : 'users.disable.success');
            onClose();
          },
          onError: error =>
            notify.apiError(isActive ? 'users.enable.error' : 'users.disable.error', error),
        },
      );
    },
    [user, updateUser, onClose],
  );

  const onValidSubmit = useCallback(
    (values: UserUpsertFormInput) => {
      if (confirmingDisable) {
        setActive(false);
        return;
      }

      const name = values.name.trim();
      const username = values.username.trim();
      if (!name || (!isEdit && !username)) return;

      if (isEdit && user) {
        updateUser.mutate(
          {
            userId: user.id,
            body: {
              name,
              role: values.role,
              email: values.email.trim() || null,
              phone: values.phone.trim() || null,
              password: values.password.trim() || undefined,
            },
          },
          {
            onSuccess: () => {
              notify.toast('users.update.success');
              onClose();
            },
            onError: error => notify.apiError('users.update.error', error),
          },
        );
        return;
      }

      if (!values.password.trim()) return;

      createUser.mutate(
        {
          username,
          name,
          role: values.role,
          email: values.email.trim() || null,
          phone: values.phone.trim() || null,
          password: values.password,
        },
        {
          onSuccess: () => {
            notify.toast('users.create.success');
            onClose();
          },
          onError: error => notify.apiError('users.create.error', error),
        },
      );
    },
    [confirmingDisable, setActive, isEdit, user, updateUser, createUser, onClose],
  );

  const handleSubmit = form.handleSubmit(onValidSubmit);

  return { isSubmitting, setActive, handleSubmit };
}
