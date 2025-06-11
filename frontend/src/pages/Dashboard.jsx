import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Users, Calendar, Trophy, Plus, TrendingUp } from 'lucide-react';
import Button from '../components/ui/Button';
import FunScoreGauge from '../components/ui/FunScoreGauge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { groupsAPI, eventsAPI, funScoreAPI } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalGroups: 0,
      upcomingEvents: 0,
      averageFunScore: 0,
      attendanceRate: 0
    },
    recentActivity: [],
    upcomingEvents: [],
    userGroups: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load data in parallel
      const [
        groupsResponse,
        userScoreResponse,
        userEventsResponse,
        attendanceStatsResponse,
      ] = await Promise.allSettled([
        groupsAPI.getUserGroups(),
        funScoreAPI.getUserScore(user?.id, null), // null for overall score
        eventsAPI.getUserEvents(),
        eventsAPI.getUserAttendanceStats(),
      ]);

      // Process groups data
      let groups = [];
      if (groupsResponse.status === 'fulfilled') {
        groups = groupsResponse.value.data || [];
      }

      // Process fun score data
      let funScore = 0;
      if (userScoreResponse.status === 'fulfilled') {
        funScore = userScoreResponse.value.data?.score || 0;
      }

      // Process events data
      let upcomingEvents = [];
      let upcomingEventsCount = 0;
      if (userEventsResponse.status === 'fulfilled') {
        const allEvents = userEventsResponse.value.data?.events || [];
        const now = new Date();
        upcomingEvents = allEvents
          .filter(event => new Date(event.dateTime) > now)
          .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
          .slice(0, 3); // Get next 3 upcoming events
        upcomingEventsCount = allEvents.filter(event => new Date(event.dateTime) > now).length;
      }

      // Process attendance stats
      let attendanceRate = 0;
      if (attendanceStatsResponse.status === 'fulfilled') {
        const stats = attendanceStatsResponse.value.data;
        attendanceRate = stats?.attendanceRate || 0;
      }

      // Generate recent activity from available data
      const recentActivity = generateRecentActivity(groups, funScore, upcomingEvents);

      setDashboardData({
        stats: {
          totalGroups: groups.length,
          upcomingEvents: upcomingEventsCount,
          averageFunScore: funScore,
          attendanceRate: Math.round(attendanceRate)
        },
        recentActivity,
        upcomingEvents: upcomingEvents,
        userGroups: groups
      });

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivity = (groups, funScore, upcomingEvents) => {
    const activities = [];
    
    // Add activities for upcoming events
    if (upcomingEvents && upcomingEvents.length > 0) {
      upcomingEvents.slice(0, 2).forEach((event, index) => {
        const eventDate = new Date(event.dateTime);
        const now = new Date();
        const timeDiff = eventDate - now;
        const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        let timeText = '';
        if (daysUntil === 0) {
          timeText = 'Today';
        } else if (daysUntil === 1) {
          timeText = 'Tomorrow';
        } else {
          timeText = `In ${daysUntil} days`;
        }
        
        activities.push({
          id: `event-${event._id}`,
          type: 'event',
          message: `Upcoming: ${event.title}`,
          time: timeText
        });
      });
    }
    
    if (groups.length > 0) {
      groups.slice(0, 2).forEach((group, index) => {
        activities.push({
          id: `group-${index}`,
          type: 'group',
          message: `Active in ${group.name}`,
          time: `${index + 1} day${index > 0 ? 's' : ''} ago`
        });
      });
    }

    if (funScore > 0) {
      activities.push({
        id: 'score-1',
        type: 'score',
        message: `Fun Score updated to ${funScore}!`,
        time: '2 days ago'
      });
    }

    // Add a default activity if none exist
    if (activities.length === 0) {
      activities.push({
        id: 'welcome',
        type: 'welcome',
        message: 'Welcome to FriendScore! Start by joining a group.',
        time: 'Just now'
      });
    }

    return activities.slice(0, 5); // Limit to 5 activities
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={loadDashboardData} 
            variant="outline" 
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { stats, recentActivity, upcomingEvents, userGroups } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-sm p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-primary-100">
          Ready to create some amazing memories with your friends?
        </p>
      </div>

      {/* Stats Grid with Fun Score Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Fun Score Gauge - Featured */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                Your Fun Score
              </h3>
            </div>
            <div className="card-body flex justify-center">
              <FunScoreGauge 
                score={stats.averageFunScore} 
                size="lg"
                animated={true}
              />
            </div>
          </div>
        </div>

        {/* Other Stats */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Groups</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalGroups}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Upcoming Events</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.upcomingEvents}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Fun Score Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="card-body">
            <div className="text-3xl font-bold text-green-600">{stats.attendanceRate}%</div>
            <div className="text-sm text-gray-500">Attendance Rate</div>
            <div className="text-xs text-gray-400 mt-1">Last 3 months</div>
          </div>
        </div>
        <div className="card text-center">
          <div className="card-body">
            <div className="text-3xl font-bold text-blue-600">{userGroups.length}</div>
            <div className="text-sm text-gray-500">Active Groups</div>
            <div className="text-xs text-gray-400 mt-1">Currently joined</div>
          </div>
        </div>
        <div className="card text-center">
          <div className="card-body">
            <div className="text-3xl font-bold text-purple-600">
              {stats.averageFunScore > 0 ? '+24' : '0'}
            </div>
            <div className="text-sm text-gray-500">Score Improvement</div>
            <div className="text-xs text-gray-400 mt-1">This month</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/groups/create">
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <Plus className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Create New Group</div>
                  <div className="text-sm text-gray-500">Start a new friend group</div>
                </div>
              </Button>
            </Link>
            <Link to="/events/create">
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <Plus className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Create Event</div>
                  <div className="text-sm text-gray-500">Plan a new hangout</div>
                </div>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Groups */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">My Groups</h3>
            <Link to="/groups" className="text-sm text-primary-600 hover:text-primary-500">
              View all
            </Link>
          </div>
          <div className="card-body">
            {userGroups.length > 0 ? (
              <div className="space-y-3">
                {userGroups.slice(0, 3).map((group) => (
                  <div key={group._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {group.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {group.members?.length || 0} members
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {group.funScore || 0}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No groups yet</h3>
                <p className="mt-1 text-sm text-gray-500">Join or create your first group!</p>
                <div className="mt-6">
                  <Link to="/groups/create">
                    <Button>Create Group</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Events</h3>
            <Link to="/events" className="text-sm text-primary-600 hover:text-primary-500">
              View all
            </Link>
          </div>
          <div className="card-body">
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event._id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {event.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {event.group?.name || 'Group'} • {new Date(event.dateTime).toLocaleDateString()} at {new Date(event.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming events</h3>
                <p className="mt-1 text-sm text-gray-500">Create an event to get started!</p>
                <div className="mt-6">
                  <Link to="/events/create">
                    <Button>Create Event</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="card-body">
            {recentActivity.length > 0 ? (
              <div className="flow-root">
                <ul className="-mb-8">
                  {recentActivity.map((activity, index) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {index !== recentActivity.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                              <TrendingUp className="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">{activity.message}</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {activity.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;