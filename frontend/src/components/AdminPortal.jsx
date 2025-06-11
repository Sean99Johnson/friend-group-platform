import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Settings, BarChart3, Calendar, Shield, Trash2, Edit, Eye, Search, Plus } from 'lucide-react';
import { adminAPIService } from '../services/adminAPI';

const AdminPortal = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });

  useEffect(() => {
    loadData();
  }, [currentView, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      switch (currentView) {
        case 'dashboard':
          const statsData = await adminAPIService.getStats();
          setStats(statsData.stats);
          break;
        case 'users':
          const usersData = await adminAPIService.getUsers(1, 10, searchTerm);
          setUsers(usersData.users);
          setPagination(usersData.pagination);
          break;
        case 'groups':
          const groupsData = await adminAPIService.getGroups(1, 10, searchTerm);
          setGroups(groupsData.groups);
          setPagination(groupsData.pagination);
          break;
        case 'events':
          const eventsData = await adminAPIService.getEvents(1, 10, searchTerm);
          setEvents(eventsData.events);
          setPagination(eventsData.pagination);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.response?.data?.message || 'Failed to load data');
    }
    setLoading(false);
  };

  const handleDelete = async (id, type) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        setLoading(true);
        switch (type) {
          case 'user':
            await adminAPIService.deleteUser(id);
            break;
          case 'group':
            await adminAPIService.deleteGroup(id);
            break;
          case 'event':
            await adminAPIService.deleteEvent(id);
            break;
        }
        await loadData(); // Reload data after deletion
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        setError(error.response?.data?.message || `Failed to delete ${type}`);
      }
      setLoading(false);
    }
  };

  const handleEdit = (item, type) => {
    setEditingItem({ ...item, type });
    setModalType('edit');
    setShowModal(true);
  };

  const handleCreate = (type) => {
    setEditingItem({ type });
    setModalType('create');
    setShowModal(true);
  };

  const handleSave = async (formData) => {
    try {
      setLoading(true);
      const { type } = editingItem;
      const isCreating = modalType === 'create';

      if (isCreating) {
        switch (type) {
          case 'user':
            await adminAPIService.createUser(formData);
            break;
          case 'group':
            await adminAPIService.createGroup(formData);
            break;
          case 'event':
            await adminAPIService.createEvent(formData);
            break;
        }
      } else {
        switch (type) {
          case 'user':
            await adminAPIService.updateUser(editingItem._id, formData);
            break;
          case 'group':
            await adminAPIService.updateGroup(editingItem._id, formData);
            break;
          case 'event':
            await adminAPIService.updateEvent(editingItem._id, formData);
            break;
        }
      }

      setShowModal(false);
      setEditingItem(null);
      await loadData(); // Reload data after save
    } catch (error) {
      console.error('Error saving:', error);
      setError(error.response?.data?.message || 'Failed to save changes');
    }
    setLoading(false);
  };

  const handleGenerateTestData = async () => {
    try {
      setLoading(true);
      await adminAPIService.generateTestData({
        userCount: 10,
        groupCount: 3,
        eventCount: 5
      });
      await loadData(); // Reload data after generation
    } catch (error) {
      console.error('Error generating test data:', error);
      setError(error.response?.data?.message || 'Failed to generate test data');
    }
    setLoading(false);
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color = "blue" }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const DataTable = ({ columns, data, onEdit, onDelete, type }) => (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {column.label}
              </th>
            ))}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row) => (
            <tr key={row._id} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEdit(row, type)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(row._id, type)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const Modal = ({ show, onClose, title, children }) => {
    if (!show) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" onClick={onClose}>
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">{title}</h3>
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    if (!stats) return <div>Loading...</div>;

    return (
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats.users.total}
            subtitle={`${stats.users.active} active`}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Total Groups"
            value={stats.groups.total}
            icon={Users}
            color="green"
          />
          <StatCard
            title="Total Events"
            value={stats.events.total}
            icon={Calendar}
            color="purple"
          />
          <StatCard
            title="System Health"
            value="Healthy"
            icon={Shield}
            color="emerald"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Users</h3>
            <div className="space-y-3">
              {stats.recentUsers?.map((user) => (
                <div key={user._id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Groups</h3>
            <div className="space-y-3">
              {stats.recentGroups?.map((group) => (
                <div key={group._id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{group.name}</p>
                    <p className="text-xs text-gray-500">Admin: {group.admin?.name}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {group.members?.length || 0} members
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { 
        key: 'isActive', 
        label: 'Status',
        render: (value) => (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {value ? 'Active' : 'Inactive'}
          </span>
        )
      },
      { 
        key: 'isAdmin', 
        label: 'Role',
        render: (value) => (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            value ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {value ? 'Admin' : 'User'}
          </span>
        )
      },
      { 
        key: 'groups', 
        label: 'Groups',
        render: (value) => value.length
      },
      { 
        key: 'createdAt', 
        label: 'Created',
        render: (value) => new Date(value).toLocaleDateString()
      }
    ];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() => handleCreate('user')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        </div>

        <DataTable
          columns={columns}
          data={users}
          onEdit={handleEdit}
          onDelete={handleDelete}
          type="user"
        />
      </div>
    );
  };

  const renderGroups = () => {
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { 
        key: 'admin', 
        label: 'Admin',
        render: (value) => value.name
      },
      { 
        key: 'members', 
        label: 'Members',
        render: (value) => value.length
      },
      { 
        key: 'createdAt', 
        label: 'Created',
        render: (value) => new Date(value).toLocaleDateString()
      }
    ];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() => handleCreate('group')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Group</span>
          </button>
        </div>

        <DataTable
          columns={columns}
          data={groups}
          onEdit={handleEdit}
          onDelete={handleDelete}
          type="group"
        />
      </div>
    );
  };

  const renderEvents = () => {
    const columns = [
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description' },
      { 
        key: 'dateTime', 
        label: 'Date',
        render: (value) => new Date(value).toLocaleDateString()
      },
      { key: 'location', label: 'Location' },
      { 
        key: 'organizer', 
        label: 'Organizer',
        render: (value) => value.name
      },
      { 
        key: 'group', 
        label: 'Group',
        render: (value) => value.name
      },
      { 
        key: 'attendees', 
        label: 'Attendees',
        render: (value) => value.length
      },
      { 
        key: 'status', 
        label: 'Status',
        render: (value) => (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            value === 'upcoming' ? 'bg-blue-100 text-blue-800' :
            value === 'ongoing' ? 'bg-yellow-100 text-yellow-800' :
            value === 'completed' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {value}
          </span>
        )
      }
    ];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() => handleCreate('event')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Event</span>
          </button>
        </div>

        <DataTable
          columns={columns}
          data={events}
          onEdit={handleEdit}
          onDelete={handleDelete}
          type="event"
        />
      </div>
    );
  };

  const renderEditModal = () => {
    if (!editingItem) return null;

    const isCreating = modalType === 'create';
    const { type } = editingItem;

    return (
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={`${isCreating ? 'Create' : 'Edit'} ${type.charAt(0).toUpperCase() + type.slice(1)}`}
      >
        <div className="space-y-4">
          {type === 'user' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  defaultValue={editingItem.name || ''}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  defaultValue={editingItem.email || ''}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {isCreating && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  defaultValue={editingItem.bio || ''}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={editingItem.isActive}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={editingItem.isAdmin}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Admin</span>
                </label>
              </div>
            </>
          )}

          {type === 'group' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  defaultValue={editingItem.name || ''}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  defaultValue={editingItem.description || ''}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {isCreating && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Admin User ID</label>
                  <input
                    type="text"
                    placeholder="Enter user ID for group admin"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </>
          )}

          {type === 'event' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  defaultValue={editingItem.title || ''}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  defaultValue={editingItem.description || ''}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                <input
                  type="datetime-local"
                  defaultValue={editingItem.dateTime ? new Date(editingItem.dateTime).toISOString().slice(0, 16) : ''}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  defaultValue={editingItem.location || ''}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {isCreating && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Group ID</label>
                    <input
                      type="text"
                      placeholder="Enter group ID"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Organizer ID</label>
                    <input
                      type="text"
                      placeholder="Enter organizer user ID"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const formData = new FormData(event.target.closest('form'));
                const data = Object.fromEntries(formData.entries());
                handleSave(data);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isCreating ? 'Create' : 'Save')}
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'groups', label: 'Groups', icon: UserPlus },
    { key: 'events', label: 'Events', icon: Calendar },
    { key: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">FriendScore Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGenerateTestData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Test Data'}
              </button>
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                Bulk Operations
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* Sidebar */}
          <nav className="w-64 bg-white rounded-lg shadow p-4 mr-8">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => setCurrentView(item.key)}
                    className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
                      currentView === item.key
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {currentView === 'dashboard' && renderDashboard()}
                {currentView === 'users' && renderUsers()}
                {currentView === 'groups' && renderGroups()}
                {currentView === 'events' && renderEvents()}
                {currentView === 'settings' && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">System Settings</h2>
                    <p className="text-gray-600">Settings panel coming soon...</p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Modal */}
      {renderEditModal()}
    </div>
  );
};

export default AdminPortal;