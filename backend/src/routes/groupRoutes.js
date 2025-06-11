const express = require('express');
const Group = require('../models/Group');
const User = require('../models/User');
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// ============== GET USER GROUPS ==============

// Get all groups for the authenticated user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all groups where the user is a member
    const groups = await Group.find({
      'members.user': userId,
      isActive: true
    })
    .populate('admin', 'name email')
    .populate('members.user', 'name email')
    .sort({ createdAt: -1 });

    // Add member count and user's role to each group
    const groupsWithStats = groups.map(group => {
      const userMember = group.members.find(member => 
        member.user._id.toString() === userId
      );
      
      return {
        ...group.toJSON(),
        memberCount: group.members.length,
        userRole: userMember ? userMember.role : 'member',
        isAdmin: group.admin._id.toString() === userId
      };
    });

    res.json({
      success: true,
      data: groupsWithStats,
      count: groupsWithStats.length
    });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============== GROUP DETAILS ==============

// Get specific group details
router.get('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId)
      .populate('admin', 'name email')
      .populate('members.user', 'name email profilePicture');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is a member
    const isMember = group.members.some(member => 
      member.user._id.toString() === userId
    );

    if (!isMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not a member of this group' 
      });
    }

    // Get recent events for this group
    const recentEvents = await Event.find({ group: groupId })
      .populate('organizer', 'name email')
      .sort({ dateTime: -1 })
      .limit(5);

    // Get upcoming events count
    const upcomingEventsCount = await Event.countDocuments({
      group: groupId,
      dateTime: { $gt: new Date() }
    });

    const userMember = group.members.find(member => 
      member.user._id.toString() === userId
    );

    const groupData = {
      ...group.toJSON(),
      memberCount: group.members.length,
      userRole: userMember ? userMember.role : 'member',
      isAdmin: group.admin._id.toString() === userId,
      recentEvents,
      upcomingEventsCount
    };

    res.json({
      success: true,
      group: groupData
    });
  } catch (error) {
    console.error('Error fetching group details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============== GROUP CREATION ==============

// Create a new group
router.post('/', async (req, res) => {
  try {
    const { name, description, isPrivate = false, maxMembers = 50 } = req.body;
    const adminId = req.user.id;

    // Generate unique invite code
    let inviteCode;
    let isUnique = false;
    
    while (!isUnique) {
      inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingGroup = await Group.findOne({ inviteCode });
      if (!existingGroup) {
        isUnique = true;
      }
    }

    // Create the group
    const group = await Group.create({
      name,
      description,
      inviteCode,
      admin: adminId,
      members: [{
        user: adminId,
        role: 'admin',
        joinedAt: new Date()
      }],
      settings: {
        isPrivate,
        maxMembers
      }
    });

    // Add group to user's groups array
    await User.findByIdAndUpdate(adminId, {
      $push: { groups: group._id }
    });

    // Populate the created group
    const populatedGroup = await Group.findById(group._id)
      .populate('admin', 'name email')
      .populate('members.user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group: {
        ...populatedGroup.toJSON(),
        memberCount: 1,
        userRole: 'admin',
        isAdmin: true
      }
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// ============== JOIN GROUP ==============

// Join a group using invite code
router.post('/join', async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    if (!inviteCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invite code is required' 
      });
    }

    // Find the group by invite code
    const group = await Group.findOne({ 
      inviteCode: inviteCode.toUpperCase(),
      isActive: true 
    });

    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid invite code' 
      });
    }

    // Check if user is already a member
    const isAlreadyMember = group.members.some(member => 
      member.user.toString() === userId
    );

    if (isAlreadyMember) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are already a member of this group' 
      });
    }

    // Check if group is at capacity
    if (group.members.length >= group.settings.maxMembers) {
      return res.status(400).json({ 
        success: false, 
        message: 'This group is at maximum capacity' 
      });
    }

    // Add user to group
    group.members.push({
      user: userId,
      role: 'member',
      joinedAt: new Date()
    });

    await group.save();

    // Add group to user's groups array
    await User.findByIdAndUpdate(userId, {
      $push: { groups: group._id }
    });

    // Populate and return the updated group
    const updatedGroup = await Group.findById(group._id)
      .populate('admin', 'name email')
      .populate('members.user', 'name email');

    res.json({
      success: true,
      message: `Successfully joined ${group.name}`,
      group: {
        ...updatedGroup.toJSON(),
        memberCount: updatedGroup.members.length,
        userRole: 'member',
        isAdmin: false
      }
    });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============== LEAVE GROUP ==============

// Leave a group
router.delete('/:groupId/leave', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is a member
    const memberIndex = group.members.findIndex(member => 
      member.user.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are not a member of this group' 
      });
    }

    // Check if user is the admin
    if (group.admin.toString() === userId) {
      // If admin is leaving and there are other members, transfer admin to someone else
      if (group.members.length > 1) {
        const newAdmin = group.members.find(member => 
          member.user.toString() !== userId
        );
        group.admin = newAdmin.user;
        newAdmin.role = 'admin';
      } else {
        // If admin is the only member, delete the group
        await Event.deleteMany({ group: groupId });
        await Group.findByIdAndDelete(groupId);
        await User.findByIdAndUpdate(userId, {
          $pull: { groups: groupId }
        });
        
        return res.json({
          success: true,
          message: 'Group deleted as you were the only member'
        });
      }
    }

    // Remove user from group
    group.members.splice(memberIndex, 1);
    await group.save();

    // Remove group from user's groups array
    await User.findByIdAndUpdate(userId, {
      $pull: { groups: groupId }
    });

    res.json({
      success: true,
      message: `Successfully left ${group.name}`
    });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============== GROUP EVENTS ==============

// Get all events for a specific group
router.get('/:groupId/events', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Verify user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(member => 
      member.user.toString() === userId
    );

    if (!isMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'You must be a member of this group to view events' 
      });
    }

    // Get events for this group
    const events = await Event.find({ group: groupId })
      .populate('organizer', 'name email')
      .populate('attendees.user', 'name email')
      .sort({ dateTime: 1 });

    res.json({
      success: true,
      data: {
        events,
        count: events.length
      }
    });
  } catch (error) {
    console.error('Error fetching group events:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============== GROUP MANAGEMENT ==============

// Update group (admin only)
router.put('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, isPrivate, maxMembers } = req.body;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is admin
    if (group.admin.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only group admin can update group settings' 
      });
    }

    // Update group
    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      {
        name,
        description,
        'settings.isPrivate': isPrivate,
        'settings.maxMembers': maxMembers
      },
      { new: true, runValidators: true }
    )
    .populate('admin', 'name email')
    .populate('members.user', 'name email');

    res.json({
      success: true,
      message: 'Group updated successfully',
      group: {
        ...updatedGroup.toJSON(),
        memberCount: updatedGroup.members.length,
        userRole: 'admin',
        isAdmin: true
      }
    });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;