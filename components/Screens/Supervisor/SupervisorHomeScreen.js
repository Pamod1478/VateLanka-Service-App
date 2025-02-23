import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { COLORS } from "../../utils/Constants";
import CustomText from "../../utils/CustomText";
import { auth } from "../../utils/firebaseConfig";
import Icon from "react-native-vector-icons/Feather";
import { subscribeToSupervisorTrucks } from "../../services/firebaseFirestore";

export default function SupervisorHomeScreen({ route, navigation }) {
  const profile = route?.params?.profile || {};
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [firstName, setFirstName] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = () => {
    return subscribeToSupervisorTrucks(
      profile.supervisorId,
      profile.municipalCouncil,
      profile.district,
      profile.ward,
      (trucksData) => {
        setTrucks(trucksData);
        setLoading(false);
        setRefreshing(false);
      }
    );
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [profile]);

  useEffect(() => {
    updateGreeting();
    if (profile.name) {
      setFirstName(profile.name);
    }
  }, [profile.name]);

  useEffect(() => {
    const unsubscribe = fetchData();
    return () => unsubscribe();
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

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.replace("LoginSelection");
    } catch (error) {
      console.error("Logout error:", error);
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
          <CustomText style={styles.headerTitle}>
            Supervisor Dashboard
          </CustomText>
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
            <CustomText style={styles.nameText}>{firstName}</CustomText>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Icon name="user" size={20} color={COLORS.primary} />
              <CustomText style={styles.infoText}>
                ID: {profile.supervisorId || "Loading..."}
              </CustomText>
            </View>
            <View style={styles.infoRow}>
              <Icon name="map-pin" size={20} color={COLORS.primary} />
              <CustomText style={styles.infoText}>
                Ward: {profile.ward || "Loading..."}
              </CustomText>
            </View>
            <View style={styles.infoRow}>
              <Icon name="grid" size={20} color={COLORS.primary} />
              <CustomText style={styles.infoText}>
                District: {profile.district || "Loading..."}
              </CustomText>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.statsCard}
          onPress={() => navigation.navigate("TrucksList", { profile })}
          activeOpacity={0.7}
        >
          <View style={styles.statsContent}>
            <Icon name="truck" size={24} color={COLORS.primary} />
            <View style={styles.statsTextContainer}>
              <CustomText style={styles.statsValue}>{trucks.length}</CustomText>
              <CustomText style={styles.statsLabel}>
                {trucks.length === 1 ? "Truck" : "Trucks"} Assigned
              </CustomText>
            </View>
            <Icon name="chevron-right" size={24} color={COLORS.primary} />
          </View>
        </TouchableOpacity>
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
  statsCard: {
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
  statsContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statsTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.primary,
  },
  statsLabel: {
    fontSize: 16,
    color: COLORS.textGray,
    marginTop: 4,
  },
});
