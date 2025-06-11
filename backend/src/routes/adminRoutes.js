const express = require('express');
const User = require('../models/User');
const Group = require('../models/Group');
const Event = require('../models/Event');
const { protect, adminOnly } = require('../middleware/auth');
const { generateToken } = require('../utils/jwt');

const router = express.Router();

// Apply admin protection to all routes
router.use(protect, adminOnly);

// ============== DASHBOARD STATS ==============
router.get('/stats', async (req, res) => {
  try {
    const [userCount, groupCount, eventCount, activeUsers] = await Promise.all([
      User.countDocuments(),
      Group.countDocuments(),
      Event.countDocuments(),
      User.countDocuments({ isActive: true })
    ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');

    const recentGroups = await Group.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('admin', 'name email')
      .select('name admin createdAt members');

    res.json({
      success: true,
      stats: {
        users: { total: userCount, active: activeUsers },
        groups: { total: groupCount },
        events: { total: eventCount },
        recentUsers,
        recentGroups
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============== USER MANAGEMENT ==============

// Get all users with pagination and search
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const searchQuery = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      User.find(searchQuery)
        .populate('groups', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(searchQuery)
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single user
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('groups');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create user
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, bio, isAdmin = false } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      bio,
      isAdmin
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, bio, isActive, isAdmin } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, bio, isActive, isAdmin },
      { new: true, runValidators: true }
    ).populate('groups');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Remove user from all groups
    await Group.updateMany(
      { 'members.user': req.params.id },
      { $pull: { members: { user: req.params.id } } }
    );

    // Delete user's events
    await Event.deleteMany({ organizer: req.params.id });

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============== GROUP MANAGEMENT ==============

// Get all groups
router.get('/groups', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const searchQuery = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const [groups, total] = await Promise.all([
      Group.find(searchQuery)
        .populate('admin', 'name email')
        .populate('members.user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Group.countDocuments(searchQuery)
    ]);

    res.json({
      success: true,
      groups,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create group
router.post('/groups', async (req, res) => {
  try {
    const { name, description, adminId } = req.body;

    // Verify admin exists
    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(400).json({ success: false, message: 'Admin user not found' });
    }

    const group = await Group.create({
      name,
      description,
      admin: adminId,
      members: [{ user: adminId, joinedAt: new Date(), role: 'admin' }]
    });

    // Add group to admin's groups array
    await User.findByIdAndUpdate(adminId, {
      $push: { groups: group._id }
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('admin', 'name email')
      .populate('members.user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group: populatedGroup
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update group
router.put('/groups/:id', async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { name, description, isActive },
      { new: true, runValidators: true }
    ).populate('admin', 'name email').populate('members.user', 'name email');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    res.json({ success: true, message: 'Group updated successfully', group });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete group
router.delete('/groups/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Remove group from all members' groups arrays
    await User.updateMany(
      { groups: req.params.id },
      { $pull: { groups: req.params.id } }
    );

    // Delete group's events
    await Event.deleteMany({ group: req.params.id });

    // Delete the group
    await Group.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============== EVENT MANAGEMENT ==============

// Get all events
router.get('/events', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const searchQuery = search ? {
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const [events, total] = await Promise.all([
      Event.find(searchQuery)
        .populate('organizer', 'name email')
        .populate('group', 'name')
        .populate('attendees.user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Event.countDocuments(searchQuery)
    ]);

    res.json({
      success: true,
      events,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create event
router.post('/events', async (req, res) => {
  try {
    const { title, description, dateTime, location, groupId, organizerId } = req.body;

    // Verify organizer and group exist
    const [organizer, group] = await Promise.all([
      User.findById(organizerId),
      Group.findById(groupId)
    ]);

    if (!organizer) {
      return res.status(400).json({ success: false, message: 'Organizer not found' });
    }
    if (!group) {
      return res.status(400).json({ success: false, message: 'Group not found' });
    }

    const event = await Event.create({
      title,
      description,
      dateTime,
      location,
      organizer: organizerId,
      group: groupId
    });

    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name email')
      .populate('group', 'name');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: populatedEvent
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update event
router.put('/events/:id', async (req, res) => {
  try {
    const { title, description, dateTime, location, status } = req.body;
    
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { title, description, dateTime, location, status },
      { new: true, runValidators: true }
    ).populate('organizer', 'name email')
     .populate('group', 'name')
     .populate('attendees.user', 'name email');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, message: 'Event updated successfully', event });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete event
router.delete('/events/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============== BULK OPERATIONS ==============

// Bulk delete users
router.post('/users/bulk-delete', async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid user IDs' });
    }

    // Remove users from groups
    await Group.updateMany(
      { 'members.user': { $in: userIds } },
      { $pull: { members: { user: { $in: userIds } } } }
    );

    // Delete users' events
    await Event.deleteMany({ organizer: { $in: userIds } });

    // Delete users
    const result = await User.deleteMany({ _id: { $in: userIds } });

    res.json({
      success: true,
      message: `${result.deletedCount} users deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate test data
router.post('/generate-test-data', async (req, res) => {
  try {
    const { userCount = 10, groupCount = 3, eventCount = 5 } = req.body;

    // Create test users
    const testUsers = [];
    for (let i = 0; i < userCount; i++) {
      testUsers.push({
        name: `Test User ${i + 1}`,
        email: `testuser${i + 1}@example.com`,
        password: 'password123',
        bio: `This is test user ${i + 1}'s bio.`
      });
    }

    const createdUsers = await User.insertMany(testUsers);

    // Create test groups
    const testGroups = [];
    for (let i = 0; i < groupCount; i++) {
      const admin = createdUsers[i % createdUsers.length];
      testGroups.push({
        name: `Test Group ${i + 1}`,
        description: `This is test group ${i + 1} for testing purposes.`,
        admin: admin._id,
        members: [{ user: admin._id, joinedAt: new Date(), role: 'admin' }]
      });
    }

    const createdGroups = await Group.insertMany(testGroups);

    // Update users with group references
    for (let i = 0; i < createdGroups.length; i++) {
      await User.findByIdAndUpdate(
        createdGroups[i].admin,
        { $push: { groups: createdGroups[i]._id } }
      );
    }

    // Create test events
    const testEvents = [];
    for (let i = 0; i < eventCount; i++) {
      const group = createdGroups[i % createdGroups.length];
      const organizer = createdUsers[i % createdUsers.length];
      
      testEvents.push({
        title: `Test Event ${i + 1}`,
        description: `This is test event ${i + 1} for testing purposes.`,
        dateTime: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000), // Future dates
        location: `Test Location ${i + 1}`,
        organizer: organizer._id,
        group: group._id
      });
    }

    await Event.insertMany(testEvents);

    res.json({
      success: true,
      message: 'Test data generated successfully',
      data: {
        users: createdUsers.length,
        groups: createdGroups.length,
        events: testEvents.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;