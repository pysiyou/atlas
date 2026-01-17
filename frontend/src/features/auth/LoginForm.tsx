/**
 * LoginForm Component
 * Login page with role selection for demo mode
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import type { UserRole } from '@/types';
import { USER_ROLE_OPTIONS, USER_ROLE_CONFIG } from '@/types';
import { ROUTES, DEMO_PASSWORD, QUICK_LOGIN_OPTIONS, VALIDATION_MESSAGES } from '@/config';
import { Button, Input, Select, Alert, Icon } from '@/shared/ui';
import { LogIn } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('receptionist');
  const [error, setError] = useState('');
  
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError(VALIDATION_MESSAGES.GENERIC.REQUIRED_FIELDS);
      return;
    }

    const success = await login(username, password, role);

    if (success) {
      navigate(ROUTES.DASHBOARD);
    } else {
      setError(VALIDATION_MESSAGES.INVALID.CREDENTIALS);
    }
  };

  const handleQuickLogin = async (demoUsername: string, demoRole: UserRole) => {
    setUsername(demoUsername);
    setPassword(DEMO_PASSWORD);
    setRole(demoRole);

    setTimeout(async () => {
      const success = await login(demoUsername, DEMO_PASSWORD, demoRole);
      if (success) {
        navigate(ROUTES.DASHBOARD);
      }
    }, 100);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex gap-8">
        {/* Login Form */}
        <div className="flex-1 bg-white rounded p-8">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-600 rounded mb-4 p-3">
              <Icon name="app-logo" className="w-full h-full text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Atlas Clinical Labs</h1>
            <p className="text-gray-600">Medical Analysis Center Management</p>
            <div className="mt-3 inline-block px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
              DEMO MODE
            </div>
          </div>
          
          {error && (
            <Alert variant="danger" className="mb-6" onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
            
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
            
            <Select
              label="Select Role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              options={USER_ROLE_OPTIONS}
              required
            />
            
            <Button type="submit" fullWidth size="lg" className="mt-6">
              <LogIn size={20} className="mr-2" />
              Login
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Demo password for all users: <code className="bg-gray-100 px-2 py-1 rounded">{DEMO_PASSWORD}</code>
            </p>
          </div>
        </div>
        
        {/* Quick Login Panel */}
        <div className="w-96 bg-white rounded p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Login</h2>
          <p className="text-sm text-gray-600 mb-6">
            Click any demo user to login instantly
          </p>
          
          <div className="space-y-3">
            {QUICK_LOGIN_OPTIONS.map((cred, index) => (
              <button
                key={index}
                onClick={() => handleQuickLogin(cred.username, cred.role)}
                className="w-full text-left p-4 border-2 border-gray-200 rounded hover:border-sky-500 hover:bg-sky-50 transition-all"
              >
                <div className="font-medium text-gray-900">{cred.name}</div>
                <div className="text-sm text-gray-500">{USER_ROLE_CONFIG[cred.role].label}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Username: {cred.username}
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Demo Features</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>✓ Patient Management</li>
              <li>✓ Test Orders & Results</li>
              <li>✓ Sample Collection</li>
              <li>✓ Result Validation</li>
              <li>✓ Billing & Payments</li>
              <li>✓ Appointments</li>
              <li>✓ Reports Generation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
