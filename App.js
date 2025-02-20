import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import {
  createStackNavigator,
  CardStyleInterpolators,
} from "@react-navigation/stack";
import WelcomeScreen from "./components/Screens/WelcomeScreen";
import LoginSelectionScreen from "./components/Screens/LoginSelectionScreen";
import DriverLoginScreen from "./components/Screens/DriverLoginScreen";
import SupervisorLoginScreen from "./components/Screens/SupervisorLoginScreen";
import SupervisorHomeScreen from "./components/Screens/Supervisor/SupervisorHomeScreen";
import DriverHomeScreen from "./components/Screens/Driver/DriverHomeScreen";
import { auth } from "./components/utils/firebaseConfig";
import "react-native-gesture-handler";

const Stack = createStackNavigator();

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    }}
  >
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="LoginSelection" component={LoginSelectionScreen} />
    <Stack.Screen name="DriverLogin" component={DriverLoginScreen} />
    <Stack.Screen name="SupervisorLogin" component={SupervisorLoginScreen} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    }}
  >
    <Stack.Screen name="SupervisorHome" component={SupervisorHomeScreen} />
    <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
  </Stack.Navigator>
);

export default function App() {
  const [initializing, setInitializing] = React.useState(true);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return unsubscribe;
  }, [initializing]);

  if (initializing) return null;

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}