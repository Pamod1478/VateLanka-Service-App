import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import {
  createStackNavigator,
  CardStyleInterpolators,
} from "@react-navigation/stack";
import WelcomeScreen from "./components/Screens/WelcomeScreen";
import LoginSelectionScreen from "./components/Screens/LoginSelectionScreen";
import DriverLoginScreen from "./components/Screens/DriverLoginScreen";
import SupervisorLoginScreen from "./components/Screens/SupervisorLoginScreen";

// Supervisor screens
import SupervisorHomeScreen from "./components/Screens/Supervisor/SupervisorHomeScreen";
import TruckDetail from "./components/Screens/Supervisor/TruckDetail";
import TruckMap from "./components/Screens/Supervisor/TruckMap";
import TrucksList from "./components/Screens/Supervisor/TrucksList";

// Driver screens
import DriverHomeScreen from "./components/Screens/Driver/DriverHomeScreen";
import MapViewScreen from "./components/Screens/Driver/MapViewScreen";
import ConfirmStopScreen from "./components/Screens/Driver/ConfirmStopScreen";

import { auth } from "./components/utils/firebaseConfig";
import { getProviderSession } from "./components/utils/authStorage";
import { COLORS } from "./components/utils/Constants";
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

const DriverStack = ({ userProfile }) => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    }}
  >
    <Stack.Screen
      name="DriverHome"
      component={DriverHomeScreen}
      initialParams={{ profile: userProfile }}
    />
    <Stack.Screen name="MapView" component={MapViewScreen} />
    <Stack.Screen
      name="ConfirmStop"
      component={ConfirmStopScreen}
      options={{
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
        presentation: "transparentModal",
      }}
    />
  </Stack.Navigator>
);

const SupervisorStack = ({ userProfile }) => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    }}
  >
    <Stack.Screen
      name="SupervisorHome"
      component={SupervisorHomeScreen}
      initialParams={{ profile: userProfile }}
    />
    <Stack.Screen name="TruckDetail" component={TruckDetail} />
    <Stack.Screen name="TruckMap" component={TruckMap} />
    <Stack.Screen name="TrucksList" component={TrucksList} />
  </Stack.Navigator>
);

export default function App() {
  const [initializing, setInitializing] = React.useState(true);
  const [user, setUser] = React.useState(null);
  const [userType, setUserType] = React.useState(null);
  const [userProfile, setUserProfile] = React.useState(null);
  const [forceUpdate, setForceUpdate] = React.useState(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (initializing) {
        console.log("Force ending initialization after timeout");
        setInitializing(false);
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [initializing]);

  useEffect(() => {
    if (user !== null) {
      console.log("User is logged in, disabling session checks");
      return;
    }

    const checkSession = async () => {
      try {
        const providerSession = await getProviderSession();
        if (providerSession && providerSession.profile) {
          if (!user || user.uid !== providerSession.uid) {
            console.log("Session check detected user change");
            setUser(providerSession);
            setUserType(providerSession.userType);
            setUserProfile(providerSession.profile);
            setForceUpdate((prev) => prev + 1);
          }
        }
      } catch (error) {
        console.error("Error in session check:", error);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 2000);

    console.log("Started session check interval");
    return () => {
      console.log("Stopped session check interval");
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("Checking for existing session...");
        const providerSession = await getProviderSession();

        if (providerSession && providerSession.profile) {
          console.log("Found existing session for:", providerSession.userType);
          console.log("Profile data:", JSON.stringify(providerSession.profile));
          setUser(providerSession);
          setUserType(providerSession.userType);
          setUserProfile(providerSession.profile);
          setForceUpdate((prev) => prev + 1);
        } else {
          console.log("No valid session found");
        }
      } catch (error) {
        console.error("Authentication initialization error:", error);
      } finally {
        setInitializing(false);
      }
    };

    initializeAuth();

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log(
        "Auth state changed:",
        firebaseUser ? "User logged in" : "No user"
      );

      if (!firebaseUser) {
        setUser(null);
        setUserType(null);
        setUserProfile(null);
        setInitializing(false);
        return;
      }

      try {
        const providerSession = await getProviderSession();
        if (providerSession && providerSession.profile) {
          console.log(
            "Found session data from auth change for:",
            providerSession.userType
          );
          console.log("Profile data:", JSON.stringify(providerSession.profile));

          setUser(providerSession);
          setUserType(providerSession.userType);
          setUserProfile(providerSession.profile);
          setForceUpdate((prev) => prev + 1);
        } else {
          console.log("Firebase user exists but no valid session found");
          setTimeout(async () => {
            const retrySession = await getProviderSession();
            if (retrySession && retrySession.profile) {
              console.log("Found session on retry");
              setUser(retrySession);
              setUserType(retrySession.userType);
              setUserProfile(retrySession.profile);
              setForceUpdate((prev) => prev + 1);
            }
          }, 1000);
        }
      } catch (error) {
        console.error("Error checking session in auth state change:", error);
      } finally {
        setInitializing(false);
      }
    });

    return unsubscribe;
  }, []);

  console.log(
    "App rendering with user:",
    user ? user.userType : "No user",
    "force update:",
    forceUpdate
  );

  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.white,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack />
      ) : userType === "supervisor" ? (
        <SupervisorStack userProfile={userProfile} />
      ) : (
        <DriverStack userProfile={userProfile} />
      )}
    </NavigationContainer>
  );
}
