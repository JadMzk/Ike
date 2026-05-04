import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { UserProvider } from './src/context/UserContext';
import type { RootStackParamList } from './src/navigation/types';
import HomeScreen from './src/screens/HomeScreen';
import CreateTaskScreen from './src/screens/CreateTaskScreen';
import PriorityPlanScreen from './src/screens/PriorityPlanScreen';
import TaskDetailScreen from './src/screens/TaskDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <NavigationContainer>
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
              name="PriorityPlan"
              component={PriorityPlanScreen}
              options={{ title: 'Priority plan' }}
            />
            <Stack.Screen
              name="TaskDetail"
              component={TaskDetailScreen}
              options={{ title: 'Task' }}
            />
          </Stack.Navigator>
          <StatusBar style="dark" />
        </NavigationContainer>
      </UserProvider>
    </SafeAreaProvider>
  );
}
