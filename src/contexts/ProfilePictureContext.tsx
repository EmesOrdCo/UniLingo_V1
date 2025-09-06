import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProfilePictureContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const ProfilePictureContext = createContext<ProfilePictureContextType | undefined>(undefined);

export function ProfilePictureProvider({ children }: { children: ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <ProfilePictureContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </ProfilePictureContext.Provider>
  );
}

export function useProfilePicture() {
  const context = useContext(ProfilePictureContext);
  if (context === undefined) {
    throw new Error('useProfilePicture must be used within a ProfilePictureProvider');
  }
  return context;
}
