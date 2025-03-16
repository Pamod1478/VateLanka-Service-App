import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Image,
} from "react-native";
import { COLORS } from "../../utils/Constants";
import CustomText from "../../utils/CustomText";
import { logout } from "../../services/firebaseAuth";
import Icon from "react-native-vector-icons/Feather";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { subscribeToSupervisorTrucks } from "../../services/firebaseFirestore";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import NotificationBanner from "../../utils/NotificationBanner";
import { makePhoneCall } from "../../utils/phoneUtils";

export default function SupervisorHomeScreen({ route, navigation }) {
  const profile = route?.params?.profile || {};
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [firstName, setFirstName] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [activeTrucks, setActiveTrucks] = useState([]);
  const [mapRegion, setMapRegion] = useState(null);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const mapRef = useRef(null);

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
    if (profile.name) {
      setFirstName(profile.name);
    }
  }, [profile.name]);

  useEffect(() => {
    const active = trucks.filter(
      (truck) => truck.routeStatus === "active" && truck.currentLocation
    );
    setActiveTrucks(active);

    if (active.length > 0) {
      const latitudes = active.map((t) => t.currentLocation.latitude);
      const longitudes = active.map((t) => t.currentLocation.longitude);

      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);

      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;

      const latDelta = Math.max(0.02, (maxLat - minLat) * 1.5);
      const lngDelta = Math.max(0.02, (maxLng - minLng) * 1.5);

      setMapRegion({
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      });
    } else if (profile.district === "District 1") {
      setMapRegion({
        latitude: 6.9271,
        longitude: 79.8612,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [trucks]);

  const fetchData = () => {
    try {
      if (
        !profile.supervisorId ||
        !profile.municipalCouncil ||
        !profile.district ||
        !profile.ward
      ) {
        console.log("Missing required profile data for Firestore query");
        setLoading(false);
        return () => {};
      }

      return subscribeToSupervisorTrucks(
        profile.supervisorId,
        profile.municipalCouncil,
        profile.district,
        profile.ward,
        (trucksData) => {
          setTrucks(trucksData || []);
          setLoading(false);
          setRefreshing(false);
          setLoadingTimeout(false);
        }
      );
    } catch (error) {
      console.error("Error fetching supervisor trucks:", error);
      setLoading(false);
      setRefreshing(false);
      return () => {};
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [profile]);

  useEffect(() => {
    const unsubscribe = fetchData();
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
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
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      showNotification("Failed to logout. Please try again.", "error");
    }
  };

  const showNotification = (message, type = "error") => {
    setNotification({
      visible: true,
      message,
      type,
    });
  };

  const handleTruckPress = (truck) => {
    setSelectedTruck(truck);

    if (truck.currentLocation) {
      mapRef.current?.animateToRegion(
        {
          latitude: truck.currentLocation.latitude,
          longitude: truck.currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
  };

  const handleCallDriver = (truck) => {
    const phoneNumber = truck.phoneNumber || "";

    makePhoneCall(
      phoneNumber,
      () => showNotification(`Calling driver: ${truck.driverName}`, "success"),
      (errorMsg) => showNotification(errorMsg, "error")
    );
  };

  const getTruckStatusColor = (status) => {
    switch (status) {
      case "active":
        return COLORS.successbanner;
      case "paused":
        return COLORS.notificationYellow;
      case "completed":
        return COLORS.completed;
      default:
        return COLORS.textGray;
    }
  };

  const getTruckStatusText = (status) => {
    switch (status) {
      case "active":
        return "Active";
      case "paused":
        return "Paused";
      case "completed":
        return "Completed";
      default:
        return "Idle";
    }
  };

  const renderTruckMarker = (truck) => {
    if (!truck.currentLocation) return null;

    return (
      <Marker
        key={truck.id}
        coordinate={{
          latitude: truck.currentLocation.latitude,
          longitude: truck.currentLocation.longitude,
        }}
        title={truck.driverName || "Driver"}
        description={truck.numberPlate || truck.id}
        onPress={() => handleTruckPress(truck)}
      >
        <Image
          source={require("../../ApplicationAssets/truck-icon.png")}
          style={styles.markerImage}
        />
      </Marker>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const activeCount = trucks.filter((t) => t.routeStatus === "active").length;
  const pausedCount = trucks.filter((t) => t.routeStatus === "paused").length;
  const completedCount = trucks.filter(
    (t) => t.routeStatus === "completed"
  ).length;
  const inactiveCount = trucks.filter(
    (t) => !t.routeStatus || t.routeStatus === "idle"
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <NotificationBanner
        {...notification}
        onHide={() => setNotification((prev) => ({ ...prev, visible: false }))}
      />

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
            <CustomText style={styles.nameText}>
              {firstName || "Supervisor"}
            </CustomText>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Icon name="user" size={20} color={COLORS.primary} />
              <CustomText style={styles.infoText}>
                ID: {profile.supervisorId || "Not available"}
              </CustomText>
            </View>
            <View style={styles.infoRow}>
              <Icon name="map-pin" size={20} color={COLORS.primary} />
              <CustomText style={styles.infoText}>
                Ward: {profile.ward || "Not available"}
              </CustomText>
            </View>
            <View style={styles.infoRow}>
              <Icon name="grid" size={20} color={COLORS.primary} />
              <CustomText style={styles.infoText}>
                District: {profile.district || "Not available"}
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

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.activeCard]}>
              <Icon name="activity" size={24} color={COLORS.successbanner} />
              <CustomText style={styles.statValue}>{activeCount}</CustomText>
              <CustomText style={styles.statLabel}>Active</CustomText>
            </View>

            <View style={[styles.statCard, styles.pausedCard]}>
              <Icon
                name="pause-circle"
                size={24}
                color={COLORS.notificationYellow}
              />
              <CustomText style={styles.statValue}>{pausedCount}</CustomText>
              <CustomText style={styles.statLabel}>Paused</CustomText>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.completedCard]}>
              <Icon name="check-circle" size={24} color={COLORS.completed} />
              <CustomText style={styles.statValue}>{completedCount}</CustomText>
              <CustomText style={styles.statLabel}>Completed</CustomText>
            </View>

            <View style={[styles.statCard, styles.inactiveCard]}>
              <Icon name="circle" size={24} color={COLORS.textGray} />
              <CustomText style={styles.statValue}>{inactiveCount}</CustomText>
              <CustomText style={styles.statLabel}>Inactive</CustomText>
            </View>
          </View>
        </View>

        <View style={styles.mapCard}>
          <View style={styles.cardHeader}>
            <Icon name="map" size={20} color={COLORS.primary} />
            <CustomText style={styles.cardTitle}>
              Live Truck Tracking
            </CustomText>

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() =>
                navigation.navigate("TruckMap", { profile, trucks })
              }
            >
              <CustomText style={styles.viewAllText}>View Full Map</CustomText>
              <Icon name="chevron-right" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            {mapRegion ? (
              <MapView
                ref={mapRef}
                provider={PROVIDER_DEFAULT}
                style={styles.map}
                region={mapRegion}
                zoomEnabled={true}
                rotateEnabled={true}
              >
                {activeTrucks.map(renderTruckMarker)}
              </MapView>
            ) : (
              <View style={styles.noMapContainer}>
                <Icon name="map-pin" size={40} color={COLORS.textGray} />
                <CustomText style={styles.noMapText}>
                  No active trucks to display
                </CustomText>
              </View>
            )}
          </View>

          <CustomText style={styles.mapFooter}>
            {activeTrucks.length} active trucks on duty
          </CustomText>
        </View>

        <View style={styles.trucksListCard}>
          <View style={styles.cardHeader}>
            <Icon name="truck" size={20} color={COLORS.primary} />
            <CustomText style={styles.cardTitle}>Your Trucks</CustomText>

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate("TrucksList", { profile })}
            >
              <CustomText style={styles.viewAllText}>View All</CustomText>
              <Icon name="chevron-right" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {trucks.length === 0 ? (
            <View style={styles.emptyListContainer}>
              <Icon name="truck" size={40} color={COLORS.textGray} />
              <CustomText style={styles.emptyListText}>
                No trucks assigned yet
              </CustomText>
            </View>
          ) : (
            <View style={styles.trucksList}>
              {trucks.slice(0, 3).map((truck) => (
                <TouchableOpacity
                  key={truck.id}
                  style={styles.truckItem}
                  onPress={() => navigation.navigate("TruckDetail", { truck })}
                >
                  <View style={styles.truckInfo}>
                    <View style={styles.truckMain}>
                      <CustomText style={styles.truckName}>
                        {truck.driverName || "Unnamed Driver"}
                      </CustomText>
                      <CustomText style={styles.truckId}>
                        {truck.id} • {truck.numberPlate || "No plate"}
                      </CustomText>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            getTruckStatusColor(truck.routeStatus) + "20",
                          borderColor: getTruckStatusColor(truck.routeStatus),
                        },
                      ]}
                    >
                      <CustomText
                        style={[
                          styles.statusText,
                          {
                            color: getTruckStatusColor(truck.routeStatus),
                          },
                        ]}
                      >
                        {getTruckStatusText(truck.routeStatus)}
                      </CustomText>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => handleCallDriver(truck)}
                  >
                    <MaterialIcon name="call" size={18} color={COLORS.white} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}

              {trucks.length > 3 && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => navigation.navigate("TrucksList", { profile })}
                >
                  <CustomText style={styles.showMoreText}>
                    Show {trucks.length - 3} more trucks
                  </CustomText>
                </TouchableOpacity>
              )}
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
  statsGrid: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    marginHorizontal: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  activeCard: {
    borderTopWidth: 3,
    borderTopColor: COLORS.successbanner,
  },
  pausedCard: {
    borderTopWidth: 3,
    borderTopColor: COLORS.notificationYellow,
  },
  completedCard: {
    borderTopWidth: 3,
    borderTopColor: COLORS.completed,
  },
  inactiveCard: {
    borderTopWidth: 3,
    borderTopColor: COLORS.textGray,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.black,
    marginTop: 5,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textGray,
  },
  mapCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
    marginLeft: 10,
    flex: 1,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 5,
  },
  mapContainer: {
    height: 200,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  noMapContainer: {
    height: 200,
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  noMapText: {
    fontSize: 16,
    color: COLORS.textGray,
    marginTop: 10,
    textAlign: "center",
  },
  mapFooter: {
    fontSize: 14,
    color: COLORS.textGray,
    textAlign: "center",
  },
  markerImage: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  trucksListCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  trucksList: {
    gap: 10,
  },
  truckItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    padding: 12,
  },
  truckInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  truckMain: {
    flex: 1,
  },
  truckName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 4,
  },
  truckId: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  callButton: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  emptyListContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyListText: {
    fontSize: 16,
    color: COLORS.textGray,
    marginTop: 10,
    textAlign: "center",
  },
  showMoreButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 5,
  },
  showMoreText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  warningBox: {
    backgroundColor: COLORS.borderGray,
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
