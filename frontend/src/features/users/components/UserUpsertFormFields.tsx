/**
 * Profile fields for create/edit user accounts.
 */
import React, { useMemo } from 'react';
import { Input, MultiSelectFilter } from '@/components';
import { FORM_FIELD_LABEL } from '@/components/inputs/inputStyles';
import { TONE, TYPE } from '@/components/theme/recipes';
import { ICONS } from '@/config/icons';
import type { UserRole } from '@/types';
import { formatDateTime } from '@/utils';
import type { UserAdminRecord } from '../api/usersAdmin';
import { userRoleFilterOptions } from '../constants/userFilterConfig';

export interface UserUpsertFormState {
  username: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  password: string;
}

export interface UserUpsertFormFieldsProps {
  formId: string;
  isEdit: boolean;
  user: UserAdminRecord | null;
  form: UserUpsertFormState;
  roleLocked: boolean;
  onChange: (patch: Partial<UserUpsertFormState>) => void;
  onSubmit: (event: React.FormEvent) => void;
}

function formatAccountTimestamp(value: string | null | undefined): string {
  return formatDateTime(value) || 'Never';
}

/**
 * Name, credentials, role, and account metadata fields.
 */
export const UserUpsertFormFields: React.FC<UserUpsertFormFieldsProps> = ({
  formId,
  isEdit,
  user,
  form,
  roleLocked,
  onChange,
  onSubmit,
}) => {
  const selectedRoleIds = useMemo(() => [form.role], [form.role]);

  const handleRoleChange = (selectedIds: string[]) => {
    if (roleLocked) return;
    const lastId = selectedIds[selectedIds.length - 1] as UserRole | undefined;
    if (lastId) {
      onChange({ role: lastId });
    }
  };

  return (
    <form id={formId} className="flex flex-col gap-space-4" onSubmit={onSubmit}>
      <Input
        label="Name"
        name="name"
        required
        value={form.name}
        onChange={event => onChange({ name: event.target.value })}
      />
      <Input
        label="Username"
        name="username"
        required={!isEdit}
        disabled={isEdit}
        value={form.username}
        onChange={event => onChange({ username: event.target.value })}
      />
      <div className={roleLocked ? 'pointer-events-none opacity-60' : undefined}>
        <label className={`${FORM_FIELD_LABEL} mb-space-1.5 block`}>
          Role <span className={`${TONE.danger.fg} ml-space-1`}>*</span>
        </label>
        <MultiSelectFilter
          label="Role"
          options={userRoleFilterOptions}
          selectedIds={selectedRoleIds}
          onChange={handleRoleChange}
          placeholder="Select role"
          showSelectAll={false}
          singleSelect
          icon={ICONS.ui.usersGroup}
          className="w-full"
        />
      </div>
      {roleLocked ? (
        <p className={`-mt-space-2 ${TYPE.meta}`}>
          The last active administrator cannot be demoted.
        </p>
      ) : null}
      <Input
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={event => onChange({ email: event.target.value })}
      />
      <Input
        label="Phone"
        name="phone"
        type="tel"
        value={form.phone}
        onChange={event => onChange({ phone: event.target.value })}
      />
      <Input
        label={isEdit ? 'New password' : 'Password'}
        name="password"
        type="password"
        required={!isEdit}
        value={form.password}
        onChange={event => onChange({ password: event.target.value })}
        helperText={isEdit ? 'Leave blank to keep the current password' : undefined}
      />
      {isEdit && user ? (
        <>
          <Input
            label="Created"
            name="createdAt"
            disabled
            value={formatAccountTimestamp(user.createdAt)}
          />
          <Input
            label="Last login"
            name="loggedInAt"
            disabled
            value={formatAccountTimestamp(user.loggedInAt)}
          />
        </>
      ) : null}
    </form>
  );
};
