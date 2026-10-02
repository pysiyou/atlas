/**
 * Create/update/disable mutations for the user upsert modal.
 */
import type { FormEvent } from 'react';
import { notify } from '@/utils/feedback';
import type { UserAdminRecord } from '../api/usersAdmin';
import { useCreateUser, useUpdateUser } from '../api/usersAdmin';
import type { UserUpsertFormState } from '../components/UserUpsertFormFields';

interface UseUserUpsertSubmitOptions {
  user: UserAdminRecord | null;
  form: UserUpsertFormState;
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

  /**
   * Disable or re-enable the account without changing other profile fields.
   */
  const setActive = (isActive: boolean) => {
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
      }
    );
  };

  /**
   * Persist profile fields (and role) for create or update.
   */
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (confirmingDisable) {
      setActive(false);
      return;
    }

    const name = form.name.trim();
    const username = form.username.trim();
    if (!name || (!isEdit && !username)) return;

    if (isEdit && user) {
      updateUser.mutate(
        {
          userId: user.id,
          body: {
            name,
            role: form.role,
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

  return { isSubmitting, setActive, handleSubmit };
}
