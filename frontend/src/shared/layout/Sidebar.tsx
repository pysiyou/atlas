/**
 * Sidebar Component
 * Navigation sidebar with role-based menu items
 * Organized into Main Menu and Settings sections
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { formatStatus } from '@/utils';
import { Avatar, Icon } from '@/shared/ui';
import { ALL_ROLES } from '@/types';
import { ROUTES } from '@/config';
import defaultAvatar from '../../assets/images/default-avatar.jpg';

import {
  LayoutDashboard,
  Users,
  FileText,
  FlaskConical,
  Calendar,
  DollarSign,
  ClipboardList,
  UserCog,
  Settings,
  Bell,
  Box,
  Shield,
  LogOut,
  ChevronsLeft,
} from 'lucide-react';

/**
 * Interface for menu items
 */
interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

/**
 * Interface for settings items (disabled buttons)
 */
interface SettingsItem {
  label: string;
  icon: React.ReactNode;
}

/**
 * Main menu items - these are active navigation links
 */
const menuItems: MenuItem[] = [
  {
    path: ROUTES.DASHBOARD,
    label: 'Dashboard',
    icon: <LayoutDashboard size={20} />,
    roles: ALL_ROLES,
  },
  {
    path: ROUTES.PATIENTS,
    label: 'Patients',
    icon: <Users size={20} />,
    roles: ['receptionist', 'administrator'],
  },
  {
    path: ROUTES.ORDERS,
    label: 'Orders',
    icon: <FileText size={20} />,
    roles: ALL_ROLES,
  },
  {
    path: ROUTES.LABORATORY,
    label: 'Laboratory',
    icon: <FlaskConical size={20} />,
    roles: ['lab-technician', 'pathologist', 'administrator'],
  },
  {
    path: ROUTES.APPOINTMENTS,
    label: 'Appointments',
    icon: <Calendar size={20} />,
    roles: ['receptionist', 'administrator'],
  },
  {
    path: ROUTES.BILLING,
    label: 'Billing',
    icon: <DollarSign size={20} />,
    roles: ['receptionist', 'administrator'],
  },
  {
    path: ROUTES.REPORTS,
    label: 'Reports',
    icon: <ClipboardList size={20} />,
    roles: ['pathologist', 'administrator'],
  },
];

/**
 * Settings section items - these are disabled buttons
 */
const settingsItems: SettingsItem[] = [
  {
    label: 'User Management',
    icon: <UserCog size={20} />,
  },
  {
    label: 'System Settings',
    icon: <Settings size={20} />,
  },
  {
    label: 'Notification & Alerts',
    icon: <Bell size={20} />,
  },
  {
    label: 'Integrations',
    icon: <Box size={20} />,
  },
  {
    label: 'Security & Privacy',
    icon: <Shield size={20} />,
  },
];

export const Sidebar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  
  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    currentUser && item.roles.includes(currentUser.role)
  );
  
  return (
    <aside 
      className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-300 ease-in-out overflow-hidden`} 
      style={{ padding: '0' }}
    >
      {/* App Header - Logo Section */}
      <div className="border-b border-gray-200 shrink-0 h-[73px] flex items-center">
        <div className="flex items-center w-full h-full"> 
          <div 
            className="w-16 flex items-center justify-center shrink-0 h-full cursor-pointer"
            onClick={() => isCollapsed && setIsCollapsed(false)}
            title={isCollapsed ? "Expand Sidebar" : undefined}
          >
            <div 
                className={`transition-cursor flex items-center justify-center`}
                onClick={() => isCollapsed && setIsCollapsed(false)}
            >
                <div className="w-8 h-8 flex items-center justify-center">
                    <Icon name="app-logo" className="w-full h-full text-sky-600" />
                </div>
            </div>
          </div>
          
          <div className={`flex-1 flex items-center justify-between min-w-0 pr-4 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="min-w-0 overflow-hidden whitespace-nowrap">
               <h1 className="text-xs font-bold text-gray-900 truncate">Atlas Clinical Labs </h1>
               <p className="text-xs text-gray-500">Version 2.4</p>
            </div>
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Collapse Sidebar"
            >
                <ChevronsLeft size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable menu content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        {/* Main Menu Section */}
        <div className="mb-6">
          <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'}`}>
             <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-6 whitespace-nowrap">
                Main Menu
             </h3>
          </div>
          <nav className="space-y-1">
            {filteredMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center min-w-0 py-2.5 transition-colors relative${
                    isActive
                      ? 'bg-sky-50 text-sky-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                  {/* Active Indicator Border (Optional polish) */}
                  {/* <div className={`absolute left-0 top-0 bottom-0 w-1 bg-sky-600 rounded-r transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`} /> */}

                  {/* Fixed Width Icon Container (w-16 matches sidebar collapsed width) */}
                  <div className="w-16 flex items-center justify-center shrink-0">
                      {item.icon}
                  </div>
                  
                  {/* Text Content */}
                  <span className={`text-sm whitespace-nowrap overflow-hidden transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                      {item.label}
                  </span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Settings Section */}
        <div>
           <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'}`}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-6 whitespace-nowrap">
                Settings
            </h3>
          </div>
          <div className="space-y-1">
            {settingsItems.map((item, index) => (
              <button
                key={index}
                disabled
                className="flex items-center min-w-0 py-2.5 w-full text-left text-gray-400 cursor-not-allowed opacity-60"
                title={isCollapsed ? item.label : "Coming soon"}
              >
                 <div className="w-16 flex items-center justify-center shrink-0">
                    {item.icon}
                </div>
                <span className={`text-sm whitespace-nowrap overflow-hidden transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                    {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Profile Section - Fixed at bottom */}
      {currentUser && (
        <div className="border-t border-gray-200 bg-gray-50 relative shrink-0">
          {/* Profile Popover for Collapsed Mode */}
          {isCollapsed && showProfileMenu && (
            <div 
              className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded shadow-md border border-gray-100 py-1 z-50 ml-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-500 truncate">{formatStatus(currentUser.role)}</p>
              </div>
              <button
                onClick={logout}
                className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}

          <div 
            className="flex items-center cursor-pointer min-w-0 w-full py-4"
            onClick={() => isCollapsed && setShowProfileMenu(!showProfileMenu)}
            title={isCollapsed ? "Click for options" : undefined}
          >
            {/* User Avatar - Fixed Width w-16 */}
            <div className="w-16 flex items-center justify-center shrink-0">
              <Avatar 
                name={currentUser.name} 
                src={defaultAvatar} 
                size="md" 
              />
            </div>
            
            {/* User Info - Collapsible */}
            <div className={`flex-1 min-w-0 flex items-center pr-4 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
               <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentUser.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {formatStatus(currentUser.role)}
                </p>
              </div>

               <button
                onClick={(e) => {
                  e.stopPropagation();
                  logout();
                }}
                className="shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-2"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
             </div>
          </div>
          
          {/* Invisible backdrop to close popover */}
          {showProfileMenu && (
            <div 
              className="fixed inset-0 z-40" 
              style={{ pointerEvents: 'auto', background: 'transparent' }} 
              onClick={() => setShowProfileMenu(false)} 
            />
          )}
        </div>
      )}
    </aside>
  );
};
