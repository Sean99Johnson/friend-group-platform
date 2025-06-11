import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  HelpCircle,
  User
} from 'lucide-react';
import { eventsAPI } from '../services/api';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, upcoming, past
  const [rsvpFilter, setRsvpFilter] = useState('all'); // all, going, maybe, not_going, no_rsvp

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await eventsAPI.getUserEvents();
      
      console.log('Events response:', response);
      
      // Handle different response structures
      const eventsData = response?.data?.data?.events || response?.data?.events || response?.data || [];
      
      console.log('Extracted events:', eventsData);
      
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (err) {
      console.error('Error loading events:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (eventId, status) => {
    try {
      setError(null);
      await eventsAPI.rsvpEvent(eventId, status);
      await loadEvents(); // Refresh events to show updated RSVP
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleCheckIn = async (eventId) => {
    try {
      setError(null);
      await eventsAPI.checkinEvent(eventId, {});
      await loadEvents(); // Refresh events to show check-in status
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const navigateToCreateEvent = () => {
    window.location.href = '/events/create';
  };

  const navigateToEventDetails = (eventId) => {
    window.location.href = `/events/${eventId}`;
  };

  // Filter events based on search and filters
  const filteredEvents = events.filter(event => {
    if (!event) return false;
    
    // Search filter
    const matchesSearch = !searchTerm || 
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.group?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Date filter
    const now = new Date();
    const eventDate = new Date(event.dateTime);
    
    if (filterStatus === 'upcoming' && eventDate <= now) return false;
    if (filterStatus === 'past' && eventDate > now) return false;

    // RSVP filter
    if (rsvpFilter !== 'all') {
      const userRSVP = event.attendees?.find(attendee => 
        attendee.user._id === JSON.parse(localStorage.getItem('user') || '{}').id
      );
      
      if (rsvpFilter === 'no_rsvp' && userRSVP) return false;
      if (rsvpFilter !== 'no_rsvp' && (!userRSVP || userRSVP.status !== rsvpFilter)) return false;
    }

    return true;
  });

  const getUserRSVP = (event) => {
    const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
    return event.attendees?.find(attendee => attendee.user._id === userId);
  };

  const isEventToday = (eventDate) => {
    const today = new Date();
    const event = new Date(eventDate);
    return today.toDateString() === event.toDateString();
  };

  const canCheckIn = (event) => {
    const userRSVP = getUserRSVP(event);
    const isToday = isEventToday(event.dateTime);
    return userRSVP?.status === 'going' && isToday && !userRSVP.checkedIn;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getRSVPIcon = (status) => {
    switch (status) {
      case 'going': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'maybe': return <HelpCircle className="h-4 w-4 text-yellow-600" />;
      case 'not_going': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <User className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRSVPCounts = (event) => {
    const counts = { going: 0, maybe: 0, not_going: 0 };
    event.attendees?.forEach(attendee => {
      if (counts.hasOwnProperty(attendee.status)) {
        counts[attendee.status]++;
      }
    });
    return counts;
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">Discover and manage events across your groups</p>
        </div>
        <button
          onClick={navigateToCreateEvent}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create Event</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Events</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>

          {/* RSVP Filter */}
          <select
            value={rsvpFilter}
            onChange={(e) => setRsvpFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All RSVPs</option>
            <option value="going">Going</option>
            <option value="maybe">Maybe</option>
            <option value="not_going">Not Going</option>
            <option value="no_rsvp">No RSVP</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterStatus !== 'all' || rsvpFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Get started by creating your first event.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const userRSVP = getUserRSVP(event);
            const rsvpCounts = getRSVPCounts(event);
            const isPastEvent = new Date(event.dateTime) < new Date();
            
            return (
              <div
                key={event._id}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Event Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 
                          className="text-xl font-semibold text-gray-900 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => navigateToEventDetails(event._id)}
                        >
                          {event.title}
                        </h3>
                        
                        {event.group && (
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                            {event.group.name}
                          </span>
                        )}
                        
                        {event.description && (
                          <p className="text-gray-600 text-sm">{event.description}</p>
                        )}
                      </div>
                      
                      {userRSVP && (
                        <div className="flex items-center space-x-1 ml-4">
                          {getRSVPIcon(userRSVP.status)}
                          <span className="text-sm text-gray-600 capitalize">
                            {userRSVP.status.replace('_', ' ')}
                          </span>
                          {userRSVP.checkedIn && (
                            <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Checked In
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          {formatDate(event.dateTime)} at {formatTime(event.dateTime)}
                        </span>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span className="text-sm">{event.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          by {event.organizer?.name || 'Unknown'}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          {rsvpCounts.going} going, {rsvpCounts.maybe} maybe
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {!isPastEvent && (
                        <>
                          <button
                            onClick={() => handleRSVP(event._id, 'going')}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                              userRSVP?.status === 'going'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                            }`}
                          >
                            Going
                          </button>
                          
                          <button
                            onClick={() => handleRSVP(event._id, 'maybe')}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                              userRSVP?.status === 'maybe'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700'
                            }`}
                          >
                            Maybe
                          </button>
                          
                          <button
                            onClick={() => handleRSVP(event._id, 'not_going')}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                              userRSVP?.status === 'not_going'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700'
                            }`}
                          >
                            Can't Go
                          </button>

                          {canCheckIn(event) && (
                            <button
                              onClick={() => handleCheckIn(event._id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                              Check In
                            </button>
                          )}
                        </>
                      )}
                      
                      <button
                        onClick={() => navigateToEventDetails(event._id)}
                        className="px-3 py-1 border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Events;