import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  CreateTask: undefined;
  EditTask: { taskId: number };
  PriorityLandscape: undefined;
  TaskDetail: { taskId: number };
};

export type ScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
