// src/pages/Dashboard.jsx - Updated with Fun Score Gauge
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Users, Calendar, Trophy, Plus, TrendingUp } from 'lucide-react';
import Button from '../components/ui/Button';
import FunScoreGauge from '../components/ui/FunScoreGauge';

const Dashboard = () => {
  const { user } = useAuth();

  // Mock data for demonstration (will be replaced with real API data)
  const mockStats = {
    totalGroups: 3,
    upcomingEvents: 5,
    averageFunScore: 672,
    attendanceRate: 87
  };

  const mockRecentActivity = [
    { id: 1, type: 'event', message: 'Game Night at Sarah\'s', time: '2 hours ago' },
    { id: 2, type: 'score', message: 'Fun Score increased to 672!', time: '1 day ago' },
    { id: 3, type: 'group', message: 'Joined "Hiking Buddies" group', time: '3 days ago' },
  ];

  const mockUpcomingEvents = [
    { id: 1, title: 'Weekend Brunch', group: 'College Friends', date: 'Tomorrow, 11:00 AM' },
    { id: 2, title: 'Movie Night', group: 'Work Squad', date: 'Friday, 7:00 PM' },
    { id: 3, title: 'Hiking Trip', group: 'Hiking Buddies', date: 'Saturday, 8:00 AM' },
  ];

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
                score={mockStats.averageFunScore} 
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
                <p className="text-2xl font-semibold text-gray-900">{mockStats.totalGroups}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{mockStats.upcomingEvents}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Fun Score Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="card-body">
            <div className="text-3xl font-bold text-green-600">87%</div>
            <div className="text-sm text-gray-500">Attendance Rate</div>
            <div className="text-xs text-gray-400 mt-1">Last 3 months</div>
          </div>
        </div>
        <div className="card text-center">
          <div className="card-body">
            <div className="text-3xl font-bold text-blue-600">8</div>
            <div className="text-sm text-gray-500">Events Hosted</div>
            <div className="text-xs text-gray-400 mt-1">This year</div>
          </div>
        </div>
        <div className="card text-center">
          <div className="card-body">
            <div className="text-3xl font-bold text-purple-600">+24</div>
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
        {/* Upcoming Events */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Events</h3>
            <Link to="/events" className="text-sm text-primary-600 hover:text-primary-500">
              View all
            </Link>
          </div>
          <div className="card-body">
            {mockUpcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {mockUpcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {event.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {event.group} • {event.date}
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
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="card-body">
            {mockRecentActivity.length > 0 ? (
              <div className="flow-root">
                <ul className="-mb-8">
                  {mockRecentActivity.map((activity, index) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {index !== mockRecentActivity.length - 1 ? (
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