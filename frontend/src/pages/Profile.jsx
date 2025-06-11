import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Camera, Edit2, Save, X } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would typically make an API call to update the user
      // For now, we'll just update the local context
      updateUser(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      bio: user?.bio || '',
    });
    setIsEditing(false);
  };

  // Mock stats data
  const userStats = {
    totalGroups: 3,
    totalEvents: 24,
    eventsHosted: 8,
    attendanceRate: 87,
    totalFriends: 42,
    averageFunScore: 672
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-3xl font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50">
                <Camera size={16} className="text-gray-600" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {!isEditing ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 size={16} className="mr-2" />
                      Edit
                    </Button>
                  </div>
                  <p className="text-gray-600">{user?.email}</p>
                  <p className="text-gray-700">{user?.bio || 'No bio yet'}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell us about yourself..."
                      className="input-field resize-none"
                      rows="3"
                      maxLength="200"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.bio.length}/200 characters
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      size="sm"
                      loading={isSubmitting}
                    >
                      <Save size={16} className="mr-2" />
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                    >
                      <X size={16} className="mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card text-center">
          <div className="card-body">
            <div className="text-2xl font-bold text-primary-600">{userStats.totalGroups}</div>
            <div className="text-sm text-gray-500">Groups</div>
          </div>
        </div>
        <div className="card text-center">
          <div className="card-body">
            <div className="text-2xl font-bold text-secondary-600">{userStats.totalEvents}</div>
            <div className="text-sm text-gray-500">Events</div>
          </div>
        </div>
        <div className="card text-center">
          <div className="card-body">
            <div className="text-2xl font-bold text-yellow-600">{userStats.eventsHosted}</div>
            <div className="text-sm text-gray-500">Hosted</div>
          </div>
        </div>
        <div className="card text-center">
          <div className="card-body">
            <div className="text-2xl font-bold text-green-600">{userStats.attendanceRate}%</div>
            <div className="text-sm text-gray-500">Attendance</div>
          </div>
        </div>
        <div className="card text-center">
          <div className="card-body">
            <div className="text-2xl font-bold text-blue-600">{userStats.totalFriends}</div>
            <div className="text-sm text-gray-500">Friends</div>
          </div>
        </div>
        <div className="card text-center">
          <div className="card-body">
            <div className="text-2xl font-bold text-purple-600">{userStats.averageFunScore}</div>
            <div className="text-sm text-gray-500">Fun Score</div>
          </div>
        </div>
      </div>

      {/* Groups and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Groups */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">My Groups</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {/* Mock groups data */}
              {[
                { name: 'College Friends', members: 8, score: 725 },
                { name: 'Work Squad', members: 6, score: 680 },
                { name: 'Hiking Buddies', members: 12, score: 610 }
              ].map((group, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{group.name}</h4>
                    <p className="text-sm text-gray-500">{group.members} members</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-primary-600">{group.score}</div>
                    <div className="text-xs text-gray-500">Fun Score</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Achievements</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {/* Mock achievements */}
              {[
                { title: 'Event Master', description: 'Hosted 5+ events', earned: true },
                { title: 'Social Butterfly', description: 'Member of 3+ groups', earned: true },
                { title: 'Reliable Friend', description: '90% attendance rate', earned: false },
                { title: 'Party Planner', description: 'Hosted 10+ events', earned: false }
              ].map((achievement, index) => (
                <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg ${
                  achievement.earned ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    achievement.earned ? 'bg-green-500' : 'bg-gray-400'
                  }`}>
                    <span className="text-white text-lg">🏆</span>
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${achievement.earned ? 'text-green-900' : 'text-gray-500'}`}>
                      {achievement.title}
                    </h4>
                    <p className={`text-sm ${achievement.earned ? 'text-green-700' : 'text-gray-400'}`}>
                      {achievement.description}
                    </p>
                  </div>
                  {achievement.earned && (
                    <span className="text-green-600 text-sm font-medium">Earned!</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;