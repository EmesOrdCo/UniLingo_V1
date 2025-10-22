import { configureStore } from '@reduxjs/toolkit';
import avatarReducer from './slices/avatarSlice';

export const store = configureStore({
  reducer: {
    avatar: avatarReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
