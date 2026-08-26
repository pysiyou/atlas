/**
 * UserManagementSection - Admin user list and create form.
 */

import React, { useState } from 'react';
import { Badge, Button, SectionContainer, Table, type ColumnConfig } from '@/components';
import { formatDate } from '@/utils';
import { USER_ROLE_OPTIONS } from '@/types';
import { toast } from '@/app/AppToastBar';
import {
  useAdminUsersList,
  useCreateAdminUser,
} from '@/features/admin/hooks/useAdminUsers';
import type { AdminUserRecord } from '@/features/admin/api/adminUsers';
import type { UserRole } from '@/types';
import { inputBase } from '@/components/inputs/inputStyles';

const columns: ColumnConfig<AdminUserRecord>[] = [
  {
    key: 'name',
    header: 'Name',
    width: 'fill',
    render: user => <span className="text-text-primary">{user.name}</span>,
  },
  {
    key: 'username',
    header: 'Username',
    width: 'md',
    render: user => <span className="font-mono text-sm text-brand">{user.username}</span>,
  },
  {
    key: 'role',
    header: 'Role',
    width: 'md',
    render: user => <Badge variant="default" size="sm">{user.role}</Badge>,
  },
  {
    key: 'createdAt',
    header: 'Created',
    width: 'sm',
    render: user => <span className="text-xs text-text-tertiary">{formatDate(user.createdAt)}</span>,
  },
];

export const UserManagementSection: React.FC = () => {
  const { users, isLoading, isAdmin } = useAdminUsersList();
  const createMutation = useCreateAdminUser();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    username: '',
    name: '',
    role: 'lab-technician' as UserRole,
    password: '',
    email: '',
  });

  if (!isAdmin) {
    return null;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        username: form.username.trim(),
        name: form.name.trim(),
        role: form.role,
        password: form.password,
        email: form.email.trim() || undefined,
      });
      toast.success({ title: 'User created', subtitle: form.username });
      setForm({ username: '', name: '', role: 'lab-technician', password: '', email: '' });
      setShowForm(false);
    } catch {
      toast.error({ title: 'Failed to create user' });
    }
  };

  return (
    <SectionContainer
      title="User Management"
      headerRight={
        <Button variant="primary" size="sm" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : 'Add User'}
        </Button>
      }
    >
      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 p-4 border border-border-default rounded-md space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className={inputBase}
              placeholder="Full name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <input
              className={inputBase}
              placeholder="Username"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
            />
            <input
              className={inputBase}
              type="password"
              placeholder="Temporary password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
            <select
              className={inputBase}
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
            >
              {USER_ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <input
              className={inputBase}
              type="email"
              placeholder="Email (optional)"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <Button type="submit" variant="save" size="sm" isLoading={createMutation.isPending}>
            Create User
          </Button>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-text-tertiary py-4">Loading users...</p>
      ) : (
        <Table<AdminUserRecord>
          data={users}
          viewConfig={{
            fullColumns: columns,
            mediumColumns: columns,
            compactColumns: columns.slice(0, 2),
            CardComponent: ({ item }) => (
              <div className="p-3 border rounded">
                <div className="font-normal">{item.name}</div>
                <div className="text-xs text-brand font-mono">{item.username}</div>
              </div>
            ),
          }}
          striped
          pagination={false}
          getRowKey={u => u.id}
          emptyMessage="No users found"
          embedded
        />
      )}
    </SectionContainer>
  );
};
