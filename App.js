import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack";
import WelcomeScreen from "./components/Screens/WelcomeScreen";
import LoginSelectionScreen from "./components/Screens/LoginSelectionScreen";
import 'react-native-gesture-handler';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="LoginSelection" component={LoginSelectionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}