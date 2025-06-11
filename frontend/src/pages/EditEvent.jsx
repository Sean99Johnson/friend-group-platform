import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, ArrowLeft, Trash2 } from 'lucide-react';
import { eventsAPI, groupsAPI } from '../services/api';

const EditEvent = () => {
  // Get eventId from URL path
  const eventId = window.location.pathname.split('/')[2]; // /events/123/edit -> 123
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [eventLoading, setEventLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dateTime: '',
    location: '',
    groupIds: []
  });

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadEventDetails();
    loadUserGroups();
  }, [eventId]);

  const loadEventDetails = async () => {
    try {
      setEventLoading(true);
      setError(null);
      const response = await eventsAPI.getEventDetails(eventId);
      
      console.log('Event details for editing:', response);
      
      // Handle different response structures
      const eventData = response?.data?.event || response?.event || response?.data || response;
      
      if (!eventData) {
        setError('Event not found');
        return;
      }

      // Check if user is the organizer
      if (eventData.organizer?._id !== currentUser.id) {
        setError('You can only edit events you created');
        return;
      }

      // Format datetime for input field
      const dateTimeValue = eventData.dateTime ? 
        new Date(eventData.dateTime).toISOString().slice(0, 16) : '';

      // Get group IDs from invited groups or fallback to single group
      const groupIds = eventData.invitedGroups && eventData.invitedGroups.length > 0
        ? eventData.invitedGroups.map(group => group._id)
        : [eventData.group?._id].filter(Boolean);

      setFormData({
        title: eventData.title || '',
        description: eventData.description || '',
        dateTime: dateTimeValue,
        location: eventData.location || '',
        groupIds: groupIds
      });
    } catch (err) {
      console.error('Error loading event details:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load event details');
    } finally {
      setEventLoading(false);
    }
  };

  const loadUserGroups = async () => {
    try {
      setGroupsLoading(true);
      const response = await groupsAPI.getUserGroups();
      
      // Handle different response structures
      const groupsData = response?.data?.data || response?.data || response || [];
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (err) {
      console.error('Error loading groups:', err);
      // Don't set error here, just log it
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

    try {
      setLoading(true);
      setError(null);
      
      // Prepare update data
      const updateData = {
        title: formData.title,
        description: formData.description,
        dateTime: formData.dateTime,
        location: formData.location,
        groupId: formData.groupIds[0], // Primary group for backend compatibility
        invitedGroups: formData.groupIds // All invited groups
      };
      
      await eventsAPI.updateEvent(eventId, updateData);
      setSuccess(true);
    } catch (err) {
      console.error('Error updating event:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(true);
      setError(null);
      await eventsAPI.deleteEvent(eventId);
      // Navigate to events list after successful deletion
      window.location.href = '/events';
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete event');
      setDeleteLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGroupToggle = (groupId) => {
    setFormData(prev => ({
      ...prev,
      groupIds: prev.groupIds.includes(groupId)
        ? prev.groupIds.filter(id => id !== groupId)
        : [...prev.groupIds, groupId]
    }));
  };

  const navigateToEvent = () => {
    window.location.href = `/events/${eventId}`;
  };

  const navigateToEvents = () => {
    window.location.href = '/events';
  };

  // Get minimum date/time (current time + 1 hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  if (eventLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Event Updated Successfully!
          </h2>
          
          <p className="text-gray-600 mb-6">
            Your event "{formData.title}" has been updated.
          </p>
          
          <div className="flex space-x-4">
            <button
              onClick={navigateToEvents}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Events
            </button>
            <button
              onClick={navigateToEvent}
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
          onClick={navigateToEvent}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Event
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
        <p className="text-gray-600 mt-2">
          Make changes to your event details
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Edit Event Form */}
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
              disabled={loading || deleteLoading}
            />
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
                            disabled={loading || deleteLoading}
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
              disabled={loading || deleteLoading}
            />
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
              disabled={loading || deleteLoading}
            />
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
              disabled={loading || deleteLoading}
            />
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
              onClick={navigateToEvent}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading || deleteLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || deleteLoading || !formData.title.trim() || !formData.dateTime || formData.groupIds.length === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Updating...' : 'Update Event'}
            </button>
          </div>

          {/* Delete Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-red-800 mb-2">Danger Zone</h3>
              <p className="text-red-600 text-sm mb-4">
                Once you delete an event, there is no going back. This will permanently delete the event and all associated RSVPs.
              </p>
              <button
                onClick={handleDelete}
                disabled={loading || deleteLoading}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>{deleteLoading ? 'Deleting...' : 'Delete Event'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEvent;