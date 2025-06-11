const express = require('express');
const FunScore = require('../models/FunScore');
const Group = require('../models/Group');
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Get user's fun score (overall or for specific group)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { groupId } = req.query;

    // If no groupId provided, calculate overall score
    if (!groupId || groupId === 'null') {
      // Get user's scores from all groups and average them
      const userScores = await FunScore.find({ user: userId });
      
      if (userScores.length === 0) {
        return res.json({
          success: true,
          data: { score: 500 } // Default starting score
        });
      }

      const averageScore = userScores.reduce((sum, score) => sum + score.currentScore, 0) / userScores.length;
      
      return res.json({
        success: true,
        data: { 
          score: Math.round(averageScore),
          groupCount: userScores.length 
        }
      });
    }

    // Get score for specific group
    let funScore = await FunScore.findOne({ user: userId, group: groupId });
    
    if (!funScore) {
      // Create default score if doesn't exist
      funScore = await FunScore.create({
        user: userId,
        group: groupId,
        currentScore: 500
      });
    }

    res.json({
      success: true,
      data: {
        score: funScore.currentScore,
        metrics: funScore.metrics,
        lastCalculated: funScore.lastCalculated
      }
    });
  } catch (error) {
    console.error('Error fetching user score:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get group leaderboard
router.get('/leaderboard/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;

    const leaderboard = await FunScore.find({ group: groupId })
      .populate('user', 'name email profilePicture')
      .sort({ currentScore: -1 })
      .limit(50);

    res.json({
      success: true,
      data: leaderboard.map((entry, index) => ({
        rank: index + 1,
        user: entry.user,
        score: entry.currentScore,
        metrics: entry.metrics
      }))
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's score history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { groupId } = req.query;

    const funScore = await FunScore.findOne({ user: userId, group: groupId });
    
    if (!funScore) {
      return res.json({
        success: true,
        data: { history: [] }
      });
    }

    res.json({
      success: true,
      data: {
        history: funScore.scoreHistory || [],
        currentScore: funScore.currentScore
      }
    });
  } catch (error) {
    console.error('Error fetching score history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;