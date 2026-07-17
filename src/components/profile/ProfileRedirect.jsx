import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/** Redirects to the current user's performance view. */
const ProfileRedirect = () => {
  const { user } = useAuth();

  if (!user?.id) {
    return <Navigate to="/welcome" replace />;
  }

  return <Navigate to={`/users/${user.id}`} replace />;
};

export default ProfileRedirect;
