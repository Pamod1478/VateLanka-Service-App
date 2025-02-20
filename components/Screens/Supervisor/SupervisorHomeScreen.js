// components/Screens/SupervisorHomeScreen.js
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

export default function SupervisorHomeScreen({ route, navigation }) {
  // Add default values to prevent undefined errors
  const profile = route?.params?.profile || {};

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <CustomText style={styles.headerTitle}>Supervisor Dashboard</CustomText>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="log-out" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <CustomText style={styles.welcomeText}>
            Welcome back, {profile.name || 'Supervisor'}
          </CustomText>
          <CustomText style={styles.infoText}>
            Ward: {profile.ward || 'Loading...'}
          </CustomText>
          <CustomText style={styles.infoText}>
            District: {profile.district || 'Loading...'}
          </CustomText>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="truck" size={24} color={COLORS.primary} />
            <CustomText style={styles.statTitle}>Total Trucks</CustomText>
            <CustomText style={styles.statValue}>5</CustomText>
          </View>

          <View style={styles.statCard}>
            <Icon name="calendar" size={24} color={COLORS.primary} />
            <CustomText style={styles.statTitle}>Today's Routes</CustomText>
            <CustomText style={styles.statValue}>3</CustomText>
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
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
    fontWeight: '600',
    marginBottom: 10,
    color: COLORS.black,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.textGray,
    marginBottom: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
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
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 5,
  },
});