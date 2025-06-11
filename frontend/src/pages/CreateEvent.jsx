import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, ArrowLeft, Clock } from 'lucide-react';
import { eventsAPI, groupsAPI } from '../services/api';

const CreateEvent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [createdEvent, setCreatedEvent] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);

  // Get groupId from URL params if present
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedGroupId = urlParams.get('groupId');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dateTime: '',
    location: '',
    groupIds: preselectedGroupId ? [preselectedGroupId] : [] // Changed to array
  });

  useEffect(() => {
    loadUserGroups();
  }, []);

  const loadUserGroups = async () => {
    try {
      setGroupsLoading(true);
      const response = await groupsAPI.getUserGroups();
      
      // Handle different response structures
      const groupsData = response?.data?.data || response?.data || response || [];
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (err) {
      console.error('Error loading groups:', err);
      setError('Failed to load your groups');
      setGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      setError('Event title is required');
      return;
    }
    
    if (!formData.dateTime) {
      setError('Event date and time is required');
      return;
    }
    
    if (!formData.groupIds || formData.groupIds.length === 0) {
      setError('Please select at least one group for this event');
      return;
    }

    // Check if the selected date is in the future
    const eventDate = new Date(formData.dateTime);
    const now = new Date();
    if (eventDate <= now) {
      setError('Event date must be in the future');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Send to backend - for now, use the first group as primary
      const eventPayload = {
        ...formData,
        groupId: formData.groupIds[0], // Primary group for backend compatibility
        invitedGroups: formData.groupIds // All invited groups
      };
      
      const response = await eventsAPI.createEvent(eventPayload);
      
      // Handle different response structures
      const createdEventData = response?.data?.event || response?.event || response?.data;
      setCreatedEvent(createdEventData);
      setSuccess(true);
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupToggle = (groupId) => {
    setFormData(prev => ({
      ...prev,
      groupIds: prev.groupIds.includes(groupId)
        ? prev.groupIds.filter(id => id !== groupId)
        : [...prev.groupIds, groupId]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const navigateToEvents = () => {
    window.location.href = '/events';
  };

  const navigateToEventDetails = () => {
    if (createdEvent?._id) {
      window.location.href = `/events/${createdEvent._id}`;
    }
  };

  const navigateToGroup = () => {
    if (formData.groupId) {
      window.location.href = `/groups/${formData.groupId}`;
    }
  };

  // Get minimum date/time (current time + 1 hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Event Created Successfully!
          </h2>
          
          <p className="text-gray-600 mb-6">
            Your event "{createdEvent?.title}" has been created and is now visible to group members.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>
                  {createdEvent?.dateTime && new Date(createdEvent.dateTime).toLocaleString()}
                </span>
              </div>
              {createdEvent?.location && (
                <div className="flex items-center justify-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{createdEvent.location}</span>
                </div>
              )}
              <div className="flex items-center justify-center">
                <Users className="h-4 w-4 mr-2" />
                <span>
                  {formData.groupIds.length > 0 
                    ? `${formData.groupIds.length} group${formData.groupIds.length > 1 ? 's' : ''} invited`
                    : 'No groups selected'
                  }
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={navigateToEvents}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Events
            </button>
            <button
              onClick={navigateToEventDetails}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Event
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
          onClick={navigateToEvents}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
        <p className="text-gray-600 mt-2">
          Set up a new event for your group to organize activities and gatherings
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Create Event Form */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="space-y-6">
          {/* Event Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter event title"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Choose a clear, descriptive title for your event
            </p>
          </div>

          {/* Group Selection - Multiple Groups */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite Groups * (Select one or more groups)
            </label>
            {groupsLoading ? (
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                <span className="text-gray-500">Loading groups...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {groups.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">
                    You're not a member of any groups yet. 
                    <a href="/groups" className="text-blue-600 hover:text-blue-800 ml-1">
                      Join or create a group first.
                    </a>
                  </div>
                ) : (
                  groups.map((group) => (
                    <div
                      key={group._id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        formData.groupIds.includes(group._id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => handleGroupToggle(group._id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={formData.groupIds.includes(group._id)}
                            onChange={() => handleGroupToggle(group._id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            disabled={loading}
                          />
                          <div>
                            <h3 className="font-medium text-gray-900">{group.name}</h3>
                            <p className="text-sm text-gray-500">{group.memberCount} members</p>
                          </div>
                        </div>
                        {group.isAdmin && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      {group.description && (
                        <p className="text-sm text-gray-600 mt-2 ml-7">{group.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
            <p className="text-sm text-gray-500 mt-2">
              {formData.groupIds.length === 0 
                ? 'Select the groups you want to invite to this event'
                : `${formData.groupIds.length} group${formData.groupIds.length > 1 ? 's' : ''} selected`
              }
            </p>
          </div>

          {/* Date and Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date and Time *
            </label>
            <input
              type="datetime-local"
              name="dateTime"
              required
              value={formData.dateTime}
              onChange={handleInputChange}
              min={getMinDateTime()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">
              When will your event take place?
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter event location or address"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Where will your event take place? (Optional but recommended)
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Describe your event, what to bring, what to expect..."
              rows={4}
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Help people understand what your event is about
            </p>
          </div>

          {/* Preview */}
          {formData.title && formData.dateTime && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">{formData.title}</h4>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{new Date(formData.dateTime).toLocaleString()}</span>
                </div>
                {formData.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{formData.location}</span>
                  </div>
                )}
                {formData.groupIds.length > 0 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>
                      {formData.groupIds.map(groupId => {
                        const group = groups.find(g => g._id === groupId);
                        return group?.name;
                      }).filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                {formData.description && (
                  <p className="text-sm text-gray-600 mt-2">{formData.description}</p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={navigateToEvents}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.title.trim() || !formData.dateTime || formData.groupIds.length === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;