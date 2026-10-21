/**
 * Profile fields for create/edit user accounts (React Hook Form).
 */
import React, { useMemo } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from '@/components/inputs';
import { MultiSelectFilter } from '@/components/overlays';
import { text, FORM_FIELD_LABEL } from '@/theme/recipes';
import { TONE } from '@/theme/recipes';
import { ICONS } from '@/config/icons';
import type { UserRole } from '@/types';
import { formatDateTime } from '@/utils';
import type { UserAdminRecord } from '../api/usersAdmin';
import { userRoleFilterOptions } from '../constants/userFilterConfig';
import type { UserUpsertFormInput } from '../schemas/userUpsertFormSchema';

export interface UserUpsertFormFieldsProps {
  formId: string;
  isEdit: boolean;
  user: UserAdminRecord | null;
  roleLocked: boolean;
  onSubmit: (event: React.FormEvent) => void;
}

function formatAccountTimestamp(value: string | null | undefined): string {
  return formatDateTime(value) || 'Never';
}

export const UserUpsertFormFields: React.FC<UserUpsertFormFieldsProps> = ({
  formId,
  isEdit,
  user,
  roleLocked,
  onSubmit,
}) => {
  const { control } = useFormContext<UserUpsertFormInput>();
  const { field: name } = useController({ control, name: 'name' });
  const { field: username } = useController({ control, name: 'username' });
  const { field: role } = useController({ control, name: 'role' });
  const { field: email } = useController({ control, name: 'email' });
  const { field: phone } = useController({ control, name: 'phone' });
  const { field: password } = useController({ control, name: 'password' });

  const selectedRoleIds = useMemo(() => [role.value], [role.value]);

  const handleRoleChange = (selectedIds: string[]) => {
    if (roleLocked) return;
    const lastId = selectedIds[selectedIds.length - 1] as UserRole | undefined;
    if (lastId) {
      role.onChange(lastId);
    }
  };

  return (
    <form id={formId} className="flex flex-col gap-space-4" onSubmit={onSubmit}>
      <Input
        label="Name"
        name="name"
        required
        value={name.value}
        onChange={name.onChange}
      />
      <Input
        label="Username"
        name="username"
        required={!isEdit}
        disabled={isEdit}
        value={username.value}
        onChange={username.onChange}
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
        <p className={`-mt-space-2 ${text({ role: 'body', intent: 'muted' })}`}>
          The last active administrator cannot be demoted.
        </p>
      ) : null}
      <Input
        label="Email"
        name="email"
        type="email"
        value={email.value}
        onChange={email.onChange}
      />
      <Input
        label="Phone"
        name="phone"
        type="tel"
        value={phone.value}
        onChange={phone.onChange}
      />
      <Input
        label={isEdit ? 'New password' : 'Password'}
        name="password"
        type="password"
        required={!isEdit}
        value={password.value}
        onChange={password.onChange}
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
