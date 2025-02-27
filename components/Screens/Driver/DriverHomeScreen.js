import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { COLORS } from "../../utils/Constants";
import CustomText from "../../utils/CustomText";
import { logout } from "../../services/firebaseAuth";
import Icon from "react-native-vector-icons/Feather";
import { subscribeToDriverUpdates } from "../../services/firebaseFirestore";

export default function DriverHomeScreen({ route, navigation }) {
  const profile = route?.params?.profile || {};
  const [driverData, setDriverData] = useState(profile);
  const [greeting, setGreeting] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.log("Forced loading end due to timeout");
        setLoading(false);
        setLoadingTimeout(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    updateGreeting();
    if (profile.driverName) {
      setFirstName(profile.driverName);
    }
  }, [profile.driverName]);

  useEffect(() => {
    try {
      if (
        !profile.truckId ||
        !profile.municipalCouncil ||
        !profile.district ||
        !profile.ward ||
        !profile.supervisorId
      ) {
        console.log("Missing required profile data for Firestore query");
        setLoading(false);
        return () => {};
      }

      const unsubscribe = subscribeToDriverUpdates(
        profile.truckId,
        profile.municipalCouncil,
        profile.district,
        profile.ward,
        profile.supervisorId,
        (data) => {
          if (data) {
            setDriverData(data);
            if (data.driverName && !firstName) {
              setFirstName(data.driverName);
            }
          }
          setLoading(false);
          setRefreshing(false);
          setLoadingTimeout(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error subscribing to driver updates:", error);
      setLoading(false);
      setRefreshing(false);
      return () => {};
    }
  }, [profile]);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Good Morning");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      if (refreshing) {
        setRefreshing(false);
      }
    }, 5000);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to logout. Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <CustomText style={styles.headerTitle}>Driver Dashboard</CustomText>
          <CustomText style={styles.dateText}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CustomText>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="log-out" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.profileCard}>
          <View style={styles.greetingContainer}>
            <CustomText style={styles.greetingText}>{greeting},</CustomText>
            <CustomText style={styles.nameText}>
              {firstName || "Driver"}
            </CustomText>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Icon name="truck" size={20} color={COLORS.primary} />
              <CustomText style={styles.infoText}>
                Truck ID: {driverData.truckId || "Not available"}
              </CustomText>
            </View>
            <View style={styles.infoRow}>
              <Icon name="hash" size={20} color={COLORS.primary} />
              <CustomText style={styles.infoText}>
                Vehicle No: {driverData.numberPlate || "Not available"}
              </CustomText>
            </View>
            <View style={styles.infoRow}>
              <Icon name="user" size={20} color={COLORS.primary} />
              <CustomText style={styles.infoText}>
                Supervisor ID: {driverData.supervisorId || "Not available"}
              </CustomText>
            </View>
            <View style={styles.infoRow}>
              <Icon name="map-pin" size={20} color={COLORS.primary} />
              <CustomText style={styles.infoText}>
                Ward: {driverData.ward || "Not available"}
              </CustomText>
            </View>
          </View>

          {loadingTimeout && (
            <View style={styles.warningBox}>
              <Icon
                name="alert-triangle"
                size={16}
                color={COLORS.errorbanner}
              />
              <CustomText style={styles.warningText}>
                Some data may not be fully loaded. Pull down to refresh.
              </CustomText>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.primary,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textGray,
    marginTop: 4,
  },
  logoutButton: {
    padding: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  greetingContainer: {
    marginBottom: 15,
  },
  greetingText: {
    fontSize: 16,
    color: COLORS.textGray,
  },
  nameText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderGray,
    marginVertical: 15,
  },
  infoContainer: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.textGray,
  },
  warningBox: {
    backgroundColor: "#FFF5F5",
    padding: 10,
    borderRadius: 8,
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.errorbanner,
  },
  warningText: {
    color: COLORS.errorbanner,
    fontSize: 12,
    marginLeft: 8,
  },
});
