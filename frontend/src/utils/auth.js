export const getToken = () => {
  return localStorage.getItem('token');
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const removeAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

// Basic token validation (check if expired)
export const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};

// Format date for display
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

// Format Fun Score for display
export const formatFunScore = (score) => {
  if (score >= 750) return { color: 'text-green-600', label: 'Excellent' };
  if (score >= 650) return { color: 'text-blue-600', label: 'Good' };
  if (score >= 550) return { color: 'text-yellow-600', label: 'Fair' };
  if (score >= 450) return { color: 'text-orange-600', label: 'Poor' };
  return { color: 'text-red-600', label: 'Very Poor' };
};

// Generate user initials for avatar
export const getUserInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};