import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ArrowLeft,
  User,
  CheckCircle,
  XCircle,
  HelpCircle,
  Copy,
  Check,
  Edit,
  CalendarPlus,
  ChevronDown
} from 'lucide-react';
import { eventsAPI } from '../services/api';

const EventDetails = () => {
  // Get eventId from URL path
  const eventId = window.location.pathname.split('/').pop();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadEventDetails();
  }, [eventId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.relative')) {
        setShowCalendarDropdown(false);
      }
    };

    if (showCalendarDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showCalendarDropdown]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await eventsAPI.getEventDetails(eventId);
      
      console.log('Event details response:', response);
      
      // Handle different response structures
      const eventData = response?.data?.event || response?.event || response?.data || response;
      setEvent(eventData);
    } catch (err) {
      console.error('Error loading event details:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (status) => {
    try {
      setRsvpLoading(true);
      setError(null);
      await eventsAPI.rsvpEvent(eventId, status);
      await loadEventDetails(); // Refresh event data
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setCheckInLoading(true);
      setError(null);
      await eventsAPI.checkinEvent(eventId, {});
      await loadEventDetails(); // Refresh event data
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setCheckInLoading(false);
    }
  };

  const copyEventLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const navigateBack = () => {
    window.location.href = '/events';
  };

  const navigateToEdit = () => {
    window.location.href = `/events/${eventId}/edit`;
  };

  const navigateToGroup = (groupId) => {
    window.location.href = `/groups/${groupId}`;
  };

  const getUserRSVP = () => {
    if (!event?.attendees || !currentUser.id) return null;
    return event.attendees.find(attendee => attendee.user._id === currentUser.id);
  };

  const getRSVPCounts = () => {
    if (!event?.attendees) return { going: 0, maybe: 0, not_going: 0 };
    
    const counts = { going: 0, maybe: 0, not_going: 0 };
    event.attendees.forEach(attendee => {
      if (counts.hasOwnProperty(attendee.status)) {
        counts[attendee.status]++;
      }
    });
    return counts;
  };

  const getAttendeesByStatus = (status) => {
    if (!event?.attendees) return [];
    return event.attendees.filter(attendee => attendee.status === status);
  };

  const isEventToday = () => {
    if (!event?.dateTime) return false;
    const today = new Date();
    const eventDate = new Date(event.dateTime);
    return today.toDateString() === eventDate.toDateString();
  };

  const canCheckIn = () => {
    const userRSVP = getUserRSVP();
    return userRSVP?.status === 'going' && isEventToday() && !userRSVP.checkedIn;
  };

  const isEventPast = () => {
    if (!event?.dateTime) return false;
    return new Date(event.dateTime) < new Date();
  };

  const isOrganizer = () => {
    return event?.organizer?._id === currentUser.id;
  };

  const getUserVisibleGroups = () => {
    if (!event?.invitedGroups || !currentUser.id) return [];
    return event.invitedGroups || [];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
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

  // Calendar export functions
  const formatDateForCalendar = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const formatEventDescription = () => {
    let description = event.description || '';
    
    // Add organizer info
    description += `\n\nOrganized by: ${event.organizer?.name || 'Unknown'}`;
    
    // Add groups info
    const visibleGroups = getUserVisibleGroups();
    if (visibleGroups.length > 0) {
      const groupNames = visibleGroups.map(g => g.name).join(', ');
      description += `\nGroups: ${groupNames}`;
    } else if (event.group) {
      description += `\nGroup: ${event.group.name}`;
    }
    
    // Add event link
    description += `\n\nEvent Link: ${window.location.href}`;
    
    return encodeURIComponent(description.trim());
  };

  const generateGoogleCalendarUrl = () => {
    const startDate = formatDateForCalendar(event.dateTime);
    const endDate = formatDateForCalendar(new Date(new Date(event.dateTime).getTime() + 2 * 60 * 60 * 1000)); // Add 2 hours
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${startDate}/${endDate}`,
      details: formatEventDescription(),
      location: event.location || '',
      trp: 'false'
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const generateOutlookUrl = () => {
    const startDate = new Date(event.dateTime).toISOString();
    const endDate = new Date(new Date(event.dateTime).getTime() + 2 * 60 * 60 * 1000).toISOString();
    
    const params = new URLSearchParams({
      subject: event.title,
      startdt: startDate,
      enddt: endDate,
      body: formatEventDescription(),
      location: event.location || ''
    });
    
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  };

  const generateYahooCalendarUrl = () => {
    const startDate = formatDateForCalendar(event.dateTime);
    const endDate = formatDateForCalendar(new Date(new Date(event.dateTime).getTime() + 2 * 60 * 60 * 1000));
    
    const params = new URLSearchParams({
      v: '60',
      title: event.title,
      st: startDate,
      et: endDate,
      desc: formatEventDescription(),
      in_loc: event.location || ''
    });
    
    return `https://calendar.yahoo.com/?${params.toString()}`;
  };

  const generateICSFile = () => {
    const startDate = formatDateForCalendar(event.dateTime);
    const endDate = formatDateForCalendar(new Date(new Date(event.dateTime).getTime() + 2 * 60 * 60 * 1000));
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Friend Group Platform//Event//EN',
      'BEGIN:VEVENT',
      `UID:event-${event._id}@friendgroup.com`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${decodeURIComponent(formatEventDescription()).replace(/\n/g, '\\n')}`,
      `LOCATION:${event.location || ''}`,
      `URL:${window.location.href}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCalendarExport = (type) => {
    setShowCalendarDropdown(false);
    
    switch (type) {
      case 'google':
        window.open(generateGoogleCalendarUrl(), '_blank');
        break;
      case 'outlook':
        window.open(generateOutlookUrl(), '_blank');
        break;
      case 'yahoo':
        window.open(generateYahooCalendarUrl(), '_blank');
        break;
      case 'ics':
        generateICSFile();
        break;
      default:
        break;
    }
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
          Back to Events
        </button>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Event</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={navigateBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </button>
        
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600">The event you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  const userRSVP = getUserRSVP();
  const rsvpCounts = getRSVPCounts();
  const isPast = isEventPast();
  const visibleGroups = getUserVisibleGroups();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={navigateBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </button>

        <div className="flex space-x-3">
          {/* Add to Calendar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              title="Add to calendar"
            >
              <CalendarPlus className="h-4 w-4" />
              <span>Add to Calendar</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {showCalendarDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => handleCalendarExport('google')}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Google Calendar
                  </button>
                  <button
                    onClick={() => handleCalendarExport('outlook')}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Outlook Calendar
                  </button>
                  <button
                    onClick={() => handleCalendarExport('yahoo')}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Yahoo Calendar
                  </button>
                  <button
                    onClick={() => handleCalendarExport('ics')}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Download ICS File
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={copyEventLink}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            title="Copy event link"
          >
            {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>
          
          {isOrganizer() && (
            <button
              onClick={navigateToEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Event Header */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
              {isPast && (
                <span className="bg-gray-100 text-gray-800 text-sm px-2 py-1 rounded-full">
                  Past Event
                </span>
              )}
              {isEventToday() && !isPast && (
                <span className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">
                  Today
                </span>
              )}
            </div>
            
            {event.description && (
              <p className="text-gray-600 text-lg mb-4">{event.description}</p>
            )}
          </div>
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-3">
            <div className="flex items-center text-gray-700">
              <Calendar className="h-5 w-5 mr-3 text-blue-600" />
              <div>
                <p className="font-medium">{formatDate(event.dateTime)}</p>
                <p className="text-sm text-gray-500">{formatTime(event.dateTime)}</p>
              </div>
            </div>
            
            {event.location && (
              <div className="flex items-center text-gray-700">
                <MapPin className="h-5 w-5 mr-3 text-red-600" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center text-gray-700">
              <User className="h-5 w-5 mr-3 text-purple-600" />
              <span>Organized by {event.organizer?.name || 'Unknown'}</span>
            </div>
            
            {/* Groups Section - Show multiple groups */}
            {visibleGroups.length > 0 && (
              <div className="flex items-start text-gray-700">
                <Users className="h-5 w-5 mr-3 mt-0.5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">
                    {visibleGroups.length === 1 ? 'Group' : 'Invited Groups'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {visibleGroups.map((group) => (
                      <button
                        key={group._id}
                        onClick={() => navigateToGroup(group._id)}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200 transition-colors"
                      >
                        {group.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Fallback to single group if no invitedGroups */}
            {(!event.invitedGroups || event.invitedGroups.length === 0) && event.group && (
              <div className="flex items-center text-gray-700">
                <Users className="h-5 w-5 mr-3 text-green-600" />
                <button
                  onClick={() => navigateToGroup(event.group._id)}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200 transition-colors"
                >
                  {event.group.name}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RSVP Status and Actions */}
        {!isPast && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {userRSVP && (
                  <div className="flex items-center space-x-2">
                    {getRSVPIcon(userRSVP.status)}
                    <span className="text-sm font-medium capitalize">
                      You're {userRSVP.status.replace('_', ' ')}
                    </span>
                    {userRSVP.checkedIn && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full ml-2">
                        Checked In
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleRSVP('going')}
                  disabled={rsvpLoading}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    userRSVP?.status === 'going'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  Going
                </button>
                
                <button
                  onClick={() => handleRSVP('maybe')}
                  disabled={rsvpLoading}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    userRSVP?.status === 'maybe'
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700'
                  }`}
                >
                  Maybe
                </button>
                
                <button
                  onClick={() => handleRSVP('not_going')}
                  disabled={rsvpLoading}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    userRSVP?.status === 'not_going'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700'
                  }`}
                >
                  Can't Go
                </button>

                {canCheckIn() && (
                  <button
                    onClick={handleCheckIn}
                    disabled={checkInLoading}
                    className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    {checkInLoading ? 'Checking In...' : 'Check In'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Attendees Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Going */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              Going ({rsvpCounts.going})
            </h3>
          </div>
          
          <div className="space-y-2">
            {getAttendeesByStatus('going').map((attendee) => (
              <div key={attendee._id} className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                <span className="text-sm font-medium text-gray-900">
                  {attendee.user?.name || 'Unknown'}
                </span>
                {attendee.checkedIn && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Checked In
                  </span>
                )}
              </div>
            ))}
            {rsvpCounts.going === 0 && (
              <p className="text-gray-500 text-sm">No one is going yet</p>
            )}
          </div>
        </div>

        {/* Maybe */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <HelpCircle className="h-5 w-5 text-yellow-600 mr-2" />
              Maybe ({rsvpCounts.maybe})
            </h3>
          </div>
          
          <div className="space-y-2">
            {getAttendeesByStatus('maybe').map((attendee) => (
              <div key={attendee._id} className="flex items-center p-2 bg-yellow-50 rounded-md">
                <span className="text-sm font-medium text-gray-900">
                  {attendee.user?.name || 'Unknown'}
                </span>
              </div>
            ))}
            {rsvpCounts.maybe === 0 && (
              <p className="text-gray-500 text-sm">No maybes yet</p>
            )}
          </div>
        </div>

        {/* Not Going */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
              Can't Go ({rsvpCounts.not_going})
            </h3>
          </div>
          
          <div className="space-y-2">
            {getAttendeesByStatus('not_going').map((attendee) => (
              <div key={attendee._id} className="flex items-center p-2 bg-red-50 rounded-md">
                <span className="text-sm font-medium text-gray-900">
                  {attendee.user?.name || 'Unknown'}
                </span>
              </div>
            ))}
            {rsvpCounts.not_going === 0 && (
              <p className="text-gray-500 text-sm">Everyone can make it!</p>
            )}
          </div>
        </div>
      </div>

      {/* Event Summary */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{rsvpCounts.going}</div>
            <div className="text-sm text-gray-600">Going</div>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{rsvpCounts.maybe}</div>
            <div className="text-sm text-gray-600">Maybe</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{rsvpCounts.not_going}</div>
            <div className="text-sm text-gray-600">Can't Go</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {getAttendeesByStatus('going').filter(a => a.checkedIn).length}
            </div>
            <div className="text-sm text-gray-600">Checked In</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;