/**
 * React Hook Form state for the user create/edit modal.
 */
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UserAdminRecord } from '../api/usersAdmin';
import {
  userUpsertFormSchema,
  type UserUpsertFormInput,
} from '../schemas/userUpsertFormSchema';

const EMPTY_DEFAULTS: UserUpsertFormInput = {
  username: '',
  name: '',
  role: 'receptionist',
  email: '',
  phone: '',
  password: '',
};

function defaultsFromUser(user: UserAdminRecord | null): UserUpsertFormInput {
  if (!user) return EMPTY_DEFAULTS;
  return {
    username: user.username,
    name: user.name,
    role: user.role,
    email: user.email ?? '',
    phone: user.phone ?? '',
    password: '',
  };
}

export function useUserUpsertForm(user: UserAdminRecord | null) {
  const defaultValues = useMemo(() => defaultsFromUser(user), [user]);

  const form = useForm<UserUpsertFormInput>({
    resolver: zodResolver(userUpsertFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const { reset } = form;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return form;
}
