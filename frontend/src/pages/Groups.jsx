import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Settings, 
  UserPlus, 
  Crown,
  Calendar,
  Eye,
  Copy,
  Check
} from 'lucide-react';
// Import your existing API service
import { groupsAPI } from '../services/api';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  
  // Join group state
  const [joinForm, setJoinForm] = useState({
    inviteCode: ''
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await groupsAPI.getUserGroups();
      
      // Debug logging
      console.log('Groups API response:', response);
      
      // Handle different response structures
      const groupsData = response?.data?.data || response?.data || response || [];
      
      console.log('Extracted groups data:', groupsData);
      
      // Ensure we always have an array
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (err) {
      console.error('Error loading groups:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load groups');
      setGroups([]); // Ensure groups is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await groupsAPI.joinGroup(joinForm.inviteCode);
      setShowJoinModal(false);
      setJoinForm({ inviteCode: '' });
      await loadGroups();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleLeaveGroup = async (groupId, groupName) => {
    if (window.confirm(`Are you sure you want to leave "${groupName}"?`)) {
      try {
        setError(null);
        await groupsAPI.leaveGroup(groupId);
        await loadGroups();
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      }
    }
  };

  const copyInviteCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const navigateToCreateGroup = () => {
    window.location.href = '/groups/create';
  };

  const navigateToGroup = (groupId) => {
    window.location.href = `/groups/${groupId}`;
  };

  const navigateToGroupSettings = (groupId) => {
    // This would use React Router in a real app
    console.log(`Navigate to group settings ${groupId}`);
  };

  const filteredGroups = Array.isArray(groups) ? groups.filter(group =>
    group?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group?.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Groups</h1>
          <p className="text-gray-600 mt-1">Manage your friend groups and discover new ones</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowJoinModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Join Group</span>
          </button>
          <button
            onClick={navigateToCreateGroup}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Group</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No groups found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first group or joining an existing one.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div key={group._id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 truncate">{group.name}</h3>
                  {group.isAdmin && (
                    <Crown className="h-5 w-5 text-yellow-500" title="Admin" />
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {group.description || 'No description provided'}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{group.memberCount} members</span>
                    </div>
                    {group.upcomingEventsCount !== undefined && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{group.upcomingEventsCount} events</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                    {group.userRole}
                  </span>
                </div>

                {/* Invite Code */}
                {group.inviteCode && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-700">Invite Code</p>
                        <p className="text-lg font-mono font-bold text-blue-600">{group.inviteCode}</p>
                      </div>
                      <button
                        onClick={() => copyInviteCode(group.inviteCode)}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-md hover:bg-gray-100"
                        title="Copy invite code"
                      >
                        {copiedCode === group.inviteCode ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigateToGroup(group._id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </button>
                  
                  {group.isAdmin && (
                    <button
                      onClick={() => navigateToGroupSettings(group._id)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors"
                      title="Group Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  )}
                  
                  {!group.isAdmin && (
                    <button
                      onClick={() => handleLeaveGroup(group._id, group.name)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      title="Leave Group"
                    >
                      Leave
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Join Group</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invite Code *
                </label>
                <input
                  type="text"
                  required
                  value={joinForm.inviteCode}
                  onChange={(e) => setJoinForm({ ...joinForm, inviteCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  placeholder="Enter 6-character invite code"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ask a group member for the invite code
                </p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleJoinGroup}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Join Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
                  