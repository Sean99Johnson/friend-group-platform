const express = require('express');
const Event = require('../models/Event');
const Group = require('../models/Group');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// ============== GET USER EVENTS ==============

// Get all events for the authenticated user
router.get('/user', async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all groups the user is a member of
    const userGroups = await Group.find({
      'members.user': userId
    }).select('_id');

    const groupIds = userGroups.map(group => group._id);

    // Get all events from user's groups
    const events = await Event.find({
      group: { $in: groupIds }
    })
    .populate('organizer', 'name email')
    .populate('group', 'name')
    .sort({ dateTime: 1 }); // Sort by event date

    res.json({
      success: true,
      data: {
        events,
        count: events.length
      }
    });
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============== ATTENDANCE STATS ==============

// Get user's attendance statistics
router.get('/user/attendance-stats', async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all groups the user is a member of
    const userGroups = await Group.find({
      'members.user': userId
    }).select('_id');

    const groupIds = userGroups.map(group => group._id);

    // Get all past events from user's groups
    const now = new Date();
    const pastEvents = await Event.find({
      group: { $in: groupIds },
      dateTime: { $lt: now }
    });

    // Calculate attendance statistics
    let totalRSVPs = 0;
    let attendedEvents = 0;
    let hostedEvents = 0;
    let noShows = 0;

    // Count events organized by this user
    hostedEvents = await Event.countDocuments({
      organizer: userId,
      dateTime: { $lt: now }
    });

    // Analyze each past event for attendance
    pastEvents.forEach(event => {
      const userAttendee = event.attendees.find(
        attendee => attendee.user.toString() === userId.toString()
      );

      if (userAttendee) {
        // User RSVPed to this event
        if (userAttendee.status === 'going') {
          totalRSVPs++;
          
          // Check if they actually attended (checked in)
          if (userAttendee.checkedIn) {
            attendedEvents++;
          } else {
            noShows++;
          }
        }
      }
    });

    // Calculate attendance rate
    const attendanceRate = totalRSVPs > 0 ? 
      Math.round((attendedEvents / totalRSVPs) * 100) : 100;

    // Get upcoming events count
    const upcomingEvents = await Event.countDocuments({
      group: { $in: groupIds },
      dateTime: { $gt: now }
    });

    // Additional metrics
    const totalEvents = pastEvents.length + upcomingEvents;
    const eventsAttendedAllTime = attendedEvents;

    res.json({
      success: true,
      data: {
        attendanceRate,
        totalEvents,
        attendedEvents: eventsAttendedAllTime,
        hostedEvents,
        upcomingEvents,
        totalRSVPs,
        noShows,
        reliabilityScore: attendanceRate >= 80 ? 'High' : attendanceRate >= 60 ? 'Medium' : 'Low',
        stats: {
          eventsThisMonth: 0, // Can be implemented with date filtering
          averageEventsPerMonth: Math.round(totalEvents / 3), // Rough estimate
          favoriteEventDay: 'Saturday', // Can be calculated from actual data
          longestAttendanceStreak: 0 // Can be implemented with date analysis
        }
      }
    });
  } catch (error) {
    console.error('Error calculating attendance stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============== EVENT MANAGEMENT ==============

// Create a new event
router.post('/', async (req, res) => {
  try {
    const { title, description, dateTime, location, groupId } = req.body;
    const organizerId = req.user.id;

    // Verify the group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(member => member.user.toString() === organizerId);
    if (!isMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'You must be a member of this group to create events' 
      });
    }

    // Create the event
    const event = await Event.create({
      title,
      description,
      dateTime,
      location,
      organizer: organizerId,
      group: groupId
    });

    // Populate the created event
    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name email')
      .populate('group', 'name');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: populatedEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get event details
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(eventId)
      .populate('organizer', 'name email')
      .populate('group', 'name')
      .populate('attendees.user', 'name email');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if user has access to this event (member of the group)
    const group = await Group.findById(event.group._id);
    const isMember = group.members.some(member => member.user.toString() === userId);
    
    if (!isMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have access to this event' 
      });
    }

    res.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update an event (only organizer can update)
router.put('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, description, dateTime, location } = req.body;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the event organizer can update this event' 
      });
    }

    // Update the event
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { title, description, dateTime, location },
      { new: true, runValidators: true }
    )
    .populate('organizer', 'name email')
    .populate('group', 'name')
    .populate('attendees.user', 'name email');

    res.json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete an event (only organizer can delete)
router.delete('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the event organizer can delete this event' 
      });
    }

    await Event.findByIdAndDelete(eventId);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============== EVENT ACTIONS ==============

// RSVP to an event
router.put('/:eventId/rsvp', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body; // 'going', 'maybe', 'not_going'
    const userId = req.user.id;

    // Validate status
    if (!['going', 'maybe', 'not_going'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid RSVP status. Must be going, maybe, or not_going' 
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if user is a member of the group
    const group = await Group.findById(event.group);
    const isMember = group.members.some(member => member.user.toString() === userId);
    
    if (!isMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'You must be a member of this group to RSVP' 
      });
    }

    // Find existing RSVP or create new one
    const existingAttendeeIndex = event.attendees.findIndex(
      attendee => attendee.user.toString() === userId
    );

    if (existingAttendeeIndex >= 0) {
      // Update existing RSVP
      event.attendees[existingAttendeeIndex].status = status;
      event.attendees[existingAttendeeIndex].rsvpAt = new Date();
    } else {
      // Add new RSVP
      event.attendees.push({
        user: userId,
        status,
        rsvpAt: new Date()
      });
    }

    await event.save();

    // Populate the updated event
    const updatedEvent = await Event.findById(eventId)
      .populate('organizer', 'name email')
      .populate('group', 'name')
      .populate('attendees.user', 'name email');

    res.json({
      success: true,
      message: `RSVP updated to ${status}`,
      event: updatedEvent
    });
  } catch (error) {
    console.error('Error updating RSVP:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check in to an event
router.post('/:eventId/checkin', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { location } = req.body; // Optional location verification
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if event is today or in progress
    const now = new Date();
    const eventDate = new Date(event.dateTime);
    const timeDiff = Math.abs(now - eventDate);
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only check in within 24 hours of the event time' 
      });
    }

    // Find user's RSVP
    const attendeeIndex = event.attendees.findIndex(
      attendee => attendee.user.toString() === userId
    );

    if (attendeeIndex === -1) {
      return res.status(400).json({ 
        success: false, 
        message: 'You must RSVP before checking in' 
      });
    }

    // Update check-in status
    event.attendees[attendeeIndex].checkedIn = true;
    event.attendees[attendeeIndex].checkInTime = new Date();

    await event.save();

    res.json({
      success: true,
      message: 'Successfully checked in to event',
      checkInTime: event.attendees[attendeeIndex].checkInTime
    });
  } catch (error) {
    console.error('Error checking in to event:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;