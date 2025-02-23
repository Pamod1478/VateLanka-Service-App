import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { COLORS } from "../../utils/Constants";
import CustomText from "../../utils/CustomText";
import { auth } from "../../utils/firebaseConfig";
import Icon from "react-native-vector-icons/Feather";

export default function DriverHomeScreen({ route, navigation }) {
  const profile = route?.params?.profile || {};

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.replace("LoginSelection");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <CustomText style={styles.headerTitle}>Driver Dashboard</CustomText>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="log-out" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <CustomText style={styles.welcomeText}>
            Welcome back, {profile.driverName || "Driver"}
          </CustomText>
          <CustomText style={styles.infoText}>
            Truck ID: {profile.truckId || "Loading..."}
          </CustomText>
          <CustomText style={styles.infoText}>
            Number Plate: {profile.numberPlate || "Loading..."}
          </CustomText>
          <CustomText style={styles.infoText}>
            Ward: {profile.ward || "Loading..."}
          </CustomText>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="map-pin" size={24} color={COLORS.primary} />
            <CustomText style={styles.statTitle}>Today's Route</CustomText>
            <CustomText style={styles.statValue}>Route 3</CustomText>
          </View>

          <View style={styles.statCard}>
            <Icon name="package" size={24} color={COLORS.primary} />
            <CustomText style={styles.statTitle}>Collections</CustomText>
            <CustomText style={styles.statValue}>12</CustomText>
          </View>
        </View>

        <TouchableOpacity style={styles.actionButton}>
          <Icon name="navigation" size={24} color={COLORS.white} />
          <CustomText style={styles.actionButtonText}>Start Route</CustomText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 10,
    color: COLORS.black,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.textGray,
    marginBottom: 5,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statTitle: {
    fontSize: 14,
    color: COLORS.textGray,
    marginTop: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 5,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 15,
    gap: 10,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "600",
  },
});
