import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthGate } from '../hooks/useAuth';
import type { RootStackParamList } from './types';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import CreateTaskScreen from '../screens/CreateTaskScreen';
import PriorityLandscapeScreen from '../screens/PriorityLandscapeScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#f1f5f9' },
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#f1f5f9' },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateTask"
        component={CreateTaskScreen}
        options={{ title: 'New task', presentation: 'modal' }}
      />
      <Stack.Screen
        name="PriorityLandscape"
        component={PriorityLandscapeScreen}
        options={{ title: 'Task landscape' }}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{ title: 'Task' }}
      />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <AuthGate login={<LoginScreen />}>
      <MainStack />
    </AuthGate>
  );
}
