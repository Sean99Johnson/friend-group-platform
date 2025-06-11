import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Crown, 
  Copy, 
  Check, 
  ArrowLeft,
  Settings,
  Plus,
  Clock,
  MapPin,
  UserMinus
} from 'lucide-react';
import { groupsAPI } from '../services/api';

const GroupDetails = () => {
  // Get groupId from URL path
  const groupId = window.location.pathname.split('/').pop();
  
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    loadGroupDetails();
  }, [groupId]);

  const loadGroupDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await groupsAPI.getGroupDetails(groupId);
      
      console.log('Group details response:', response);
      
      // Handle different response structures
      const groupData = response?.data?.group || response?.group || response?.data || response;
      setGroup(groupData);
    } catch (err) {
      console.error('Error loading group details:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm(`Are you sure you want to leave "${group?.name}"?`)) {
      try {
        await groupsAPI.leaveGroup(groupId);
        // Navigate back to groups page
        window.location.href = '/groups';
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      }
    }
  };

  const navigateBack = () => {
    window.location.href = '/groups';
  };

  const navigateToSettings = () => {
    window.location.href = `/groups/${groupId}/settings`;
  };

  const navigateToCreateEvent = () => {
    window.location.href = `/events/create?groupId=${groupId}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={navigateBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Groups
        </button>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Group</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={navigateBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Groups
        </button>
        
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Group Not Found</h2>
          <p className="text-gray-600">The group you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={navigateBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Groups
          </button>
        </div>

        <div className="flex space-x-3">
          {group.isAdmin && (
            <button
              onClick={navigateToSettings}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
          )}
          
          <button
            onClick={navigateToCreateEvent}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* Group Header Card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
              {group.isAdmin && (
                <Crown className="h-6 w-6 text-yellow-500" title="You are the admin" />
              )}
            </div>
            
            {group.description && (
              <p className="text-gray-600 text-lg mb-4">{group.description}</p>
            )}
            
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{group.memberCount} members</span>
              </div>
              
              {group.upcomingEventsCount !== undefined && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{group.upcomingEventsCount} upcoming events</span>
                </div>
              )}
              
              <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                {group.userRole}
              </span>
            </div>
          </div>
        </div>

        {/* Invite Code */}
        {group.inviteCode && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Invite Code</p>
                <p className="text-2xl font-mono font-bold text-blue-600">{group.inviteCode}</p>
                <p className="text-xs text-gray-500 mt-1">Share this code to invite friends</p>
              </div>
              <button
                onClick={copyInviteCode}
                className="p-3 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100"
                title="Copy invite code"
              >
                {copiedCode ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Leave Group Button (for non-admins) */}
        {!group.isAdmin && (
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={handleLeaveGroup}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <UserMinus className="h-4 w-4" />
              <span>Leave Group</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Members</h2>
            
            {group.members && group.members.length > 0 ? (
              <div className="space-y-3">
                {group.members.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {member.user?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.user?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{member.user?.email || ''}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {member.role === 'admin' && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded capitalize">
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6">No members found</p>
            )}
          </div>
        </div>

        {/* Recent Events Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Events</h2>
              <button
                onClick={navigateToCreateEvent}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
              >
                + Add Event
              </button>
            </div>
            
            {group.recentEvents && group.recentEvents.length > 0 ? (
              <div className="space-y-3">
                {group.recentEvents.map((event) => (
                  <div
                    key={event._id}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <h3 className="font-medium text-gray-900 mb-1">{event.title}</h3>
                    
                    <div className="space-y-1">
                      {event.dateTime && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{new Date(event.dateTime).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {event.location && (
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        by {event.organizer?.name || 'Unknown'}
                      </span>
                      {event.attendees && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {event.attendees.length} attending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm mb-3">No events yet</p>
                <button
                  onClick={navigateToCreateEvent}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                  Create the first event
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;