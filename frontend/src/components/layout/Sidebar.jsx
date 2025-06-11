import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, Trophy, Plus, Settings } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Groups', href: '/groups', icon: Users },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  ];

  const quickActions = [
    { name: 'Create Group', href: '/groups/create', icon: Plus },
    { name: 'Create Event', href: '/events/create', icon: Plus },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          <div className="flex-grow flex flex-col">
            {/* Main Navigation */}
            <nav className="flex-1 px-2 space-y-1">
              <div className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive(item.href)
                          ? 'bg-primary-50 border-r-2 border-primary-600 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                    >
                      <Icon
                        className={`${
                          isActive(item.href) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                        } mr-3 h-5 w-5`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="mt-8">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Quick Actions
                </h3>
                <div className="mt-2 space-y-1">
                  {quickActions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors"
                      >
                        <Icon className="text-gray-400 group-hover:text-gray-500 mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </nav>
          </div>

          {/* Settings at bottom */}
          <div className="flex-shrink-0 px-2">
            <Link
              to="/settings"
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors"
            >
              <Settings className="text-gray-400 group-hover:text-gray-500 mr-3 h-5 w-5" />
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
