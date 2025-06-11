import React, { useState } from 'react';
import { Users, ArrowLeft } from 'lucide-react';
import { groupsAPI } from '../services/api';

const CreateGroup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [createdGroup, setCreatedGroup] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    maxMembers: 50
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await groupsAPI.createGroup(formData);
      setCreatedGroup(response.data.group);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const navigateToGroups = () => {
    // In a real app, you'd use React Router
    window.history.pushState({}, '', '/groups');
    window.location.reload(); // Simple navigation for demo
  };

  const navigateToNewGroup = () => {
    // Navigate to the newly created group
    window.history.pushState({}, '', `/groups/${createdGroup._id}`);
    window.location.reload();
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="h-8 w-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Group Created Successfully!
          </h2>
          
          <p className="text-gray-600 mb-6">
            Your group "{createdGroup?.name}" has been created with invite code:
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xs font-medium text-gray-700 mb-1">Invite Code</p>
            <p className="text-2xl font-mono font-bold text-blue-600">
              {createdGroup?.inviteCode}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Share this code with friends to invite them to your group
            </p>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={navigateToGroups}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Groups
            </button>
            <button
              onClick={navigateToNewGroup}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Group
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={navigateToGroups}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Groups
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">Create New Group</h1>
        <p className="text-gray-600 mt-2">
          Set up a new friend group to organize events and activities
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Create Group Form */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter a name for your group"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Choose a memorable name that represents your group
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Describe what this group is about..."
              rows={4}
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Help members understand the purpose of your group
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Members
            </label>
            <input
              type="number"
              name="maxMembers"
              min="2"
              max="100"
              value={formData.maxMembers}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Set the maximum number of people who can join this group
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="isPrivate"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                disabled={loading}
              />
              <div className="ml-3">
                <label htmlFor="isPrivate" className="text-sm font-medium text-gray-700">
                  Private Group
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  Private groups require an invite code to join. Public groups can be discovered by anyone.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={navigateToGroups}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.name.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;