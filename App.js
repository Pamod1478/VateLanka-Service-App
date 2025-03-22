import React, { useState, useEffect, useRef } from "react";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import {
  createStackNavigator,
  CardStyleInterpolators,
} from "@react-navigation/stack";
import WelcomeScreen from "./components/Screens/WelcomeScreen";
import SupervisorLoginScreen from "./components/Screens/SupervisorLoginScreen";

import SupervisorHomeScreen from "./components/Screens/Supervisor/SupervisorHomeScreen";
import TruckDetail from "./components/Screens/Supervisor/TruckDetail";
import TruckMap from "./components/Screens/Supervisor/TruckMap";
import TrucksList from "./components/Screens/Supervisor/TrucksList";
import TicketsListScreen from "./components/Screens/Supervisor/TicketsListScreen";
import TicketDetailScreen from "./components/Screens/Supervisor/TicketDetailScreen";
import AssignTicketScreen from "./components/Screens/Supervisor/AssignTicketScreen";

import { auth } from "./components/utils/firebaseConfig";
import { getProviderSession } from "./components/utils/authStorage";
import { COLORS } from "./components/utils/Constants";
import CustomText from "./components/utils/CustomText";
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
    <Stack.Screen name="SupervisorLogin" component={SupervisorLoginScreen} />
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
    <Stack.Screen name="TicketsList" component={TicketsListScreen} />
    <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
    <Stack.Screen name="AssignTicket" component={AssignTicketScreen} />
  </Stack.Navigator>
);

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [hasError, setHasError] = useState(false);
  const sessionCheckInterval = useRef(null);

  useEffect(() => {
    const errorHandler = (error, isFatal) => {
      if (isFatal) {
        console.error("FATAL ERROR:", error);
        setHasError(true);
      } else {
        console.error("NON-FATAL ERROR:", error);
      }
    };

    if (__DEV__) {
      const originalGlobalHandler = global.ErrorUtils.getGlobalHandler();
      global.ErrorUtils.setGlobalHandler((error, isFatal) => {
        errorHandler(error, isFatal);
        originalGlobalHandler(error, isFatal);
      });

      return () => {
        global.ErrorUtils.setGlobalHandler(originalGlobalHandler);
      };
    }

    return () => {};
  }, []);

  // Function to check for a valid session
  const checkForValidSession = async () => {
    try {
      const providerSession = await getProviderSession();

      if (
        providerSession &&
        providerSession.profile &&
        providerSession.userType === "supervisor"
      ) {
        console.log("Valid supervisor session found in session check");
        setUser(providerSession);
        setUserProfile(providerSession.profile);

        // Clear interval once we have a valid session
        if (sessionCheckInterval.current) {
          clearInterval(sessionCheckInterval.current);
          sessionCheckInterval.current = null;
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking session:", error);
      return false;
    }
  };

  // Authentication initialization
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("Checking for existing supervisor session...");
        const found = await checkForValidSession();

        if (!found) {
          console.log("No valid supervisor session found on init");
        }
      } catch (error) {
        console.error("Authentication initialization error:", error);
      } finally {
        setInitializing(false);
      }
    };

    // Initialize auth and set a timeout to prevent hanging
    const initPromise = initializeAuth();
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.log("Auth initialization timed out");
        resolve();
      }, 5000);
    });

    Promise.race([initPromise, timeoutPromise]).then(() => {
      if (initializing) {
        setInitializing(false);
      }
    });

    // Set up auth state listener
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log(
        "Auth state changed:",
        firebaseUser ? "User logged in" : "No user"
      );

      if (!firebaseUser) {
        setUser(null);
        setUserProfile(null);

        // Clear any active session checking
        if (sessionCheckInterval.current) {
          clearInterval(sessionCheckInterval.current);
          sessionCheckInterval.current = null;
        }

        if (initializing) setInitializing(false);
        return;
      }

      // Start checking for session after a successful Firebase login
      // but no valid session found immediately
      const found = await checkForValidSession();

      if (!found) {
        console.log("Starting session check interval...");

        // Clear any existing interval before starting a new one
        if (sessionCheckInterval.current) {
          clearInterval(sessionCheckInterval.current);
        }

        // Check every 1 second for up to 10 seconds
        let attempts = 0;
        const maxAttempts = 10;

        sessionCheckInterval.current = setInterval(async () => {
          attempts++;
          console.log(`Session check attempt ${attempts}/${maxAttempts}`);

          const sessionFound = await checkForValidSession();

          if (sessionFound || attempts >= maxAttempts) {
            clearInterval(sessionCheckInterval.current);
            sessionCheckInterval.current = null;

            if (!sessionFound && attempts >= maxAttempts) {
              console.log("Session check timed out after maximum attempts");
            }
          }
        }, 1000);
      }

      if (initializing) setInitializing(false);
    });

    return () => {
      unsubscribe();
      // Clear interval if component unmounts
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, []);

  if (hasError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <CustomText
          style={{ fontSize: 18, marginBottom: 20, textAlign: "center" }}
        >
          Something went wrong. Please restart the app.
        </CustomText>
        <TouchableOpacity
          style={{
            padding: 12,
            backgroundColor: COLORS.primary,
            borderRadius: 8,
          }}
          onPress={() => setHasError(false)}
        >
          <CustomText style={{ color: COLORS.white }}>Try Again</CustomText>
        </TouchableOpacity>
      </View>
    );
  }

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
      {!user ? <AuthStack /> : <SupervisorStack userProfile={userProfile} />}
    </NavigationContainer>
  );
}
