import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
} from "react-native";
import { COLORS } from "../../utils/Constants";
import CustomText from "../../utils/CustomText";
import { logout } from "../../services/firebaseAuth";
import Icon from "react-native-vector-icons/Feather";
import { subscribeToDriverUpdates } from "../../services/firebaseFirestore";
import locationService from "../../utils/LocationService";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import NotificationBanner from "../../utils/NotificationBanner";

export default function DriverHomeScreen({ route, navigation }) {
  const profile = route?.params?.profile || {};
  const [driverData, setDriverData] = useState(profile);
  const [greeting, setGreeting] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  const [routeStatus, setRouteStatus] = useState("idle");
  const [currentLocation, setCurrentLocation] = useState(null);

  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success",
  });

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

    if (
      profile.truckId &&
      profile.municipalCouncil &&
      profile.district &&
      profile.ward &&
      profile.supervisorId
    ) {
      locationService.setTruckInfo(
        profile.truckId,
        profile.municipalCouncil,
        profile.district,
        profile.ward,
        profile.supervisorId
      );
    }

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({});
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch (error) {
        console.error("Error getting initial location:", error);
      }
    })();
  }, [profile]);

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

            if (data.routeStatus) {
              setRouteStatus(data.routeStatus);
            }

            if (data.currentLocation) {
              setCurrentLocation(data.currentLocation);
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
      setRefreshing(false);
    }, 1000);
  }, []);

  const showNotification = (message, type) => {
    setNotification({
      visible: true,
      message,
      type,
    });
  };

  const handleLogout = async () => {
    try {
      if (routeStatus === "active" || routeStatus === "paused") {
        await locationService.stopRoute();
      }
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      showNotification("Failed to logout. Please try again.", "error");
    }
  };

  const handleStartRoute = async () => {
    try {
      if (Platform.OS === "ios") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          showNotification(
            "Location permission is required to track routes.",
            "error"
          );
          return;
        }

        await Location.getCurrentPositionAsync({});
      }

      await locationService.startRoute();
      setRouteStatus("active");
      showNotification("Route started successfully!", "success");
    } catch (error) {
      console.error("Error starting route:", error);
      showNotification(error.message || "Failed to start route", "error");
    }
  };

  const handlePauseRoute = async () => {
    try {
      await locationService.pauseRoute();
      setRouteStatus("paused");
      showNotification("Route paused", "success");
    } catch (error) {
      console.error("Error pausing route:", error);
      showNotification(error.message || "Failed to pause route", "error");
    }
  };

  const handleResumeRoute = async () => {
    try {
      await locationService.resumeRoute();
      setRouteStatus("active");
      showNotification("Route resumed", "success");
    } catch (error) {
      console.error("Error resuming route:", error);
      showNotification(error.message || "Failed to resume route", "error");
    }
  };

  const handleStopRoute = async () => {
    try {
      await locationService.stopRoute();
      setRouteStatus("completed");
      showNotification("Route ended successfully", "success");
    } catch (error) {
      console.error("Error stopping route:", error);
      showNotification(error.message || "Failed to stop route", "error");
    }
  };

  const confirmStopRoute = () => {
    navigation.navigate("ConfirmStop", {
      onConfirm: handleStopRoute,
    });
  };

  const navigateToMapView = () => {
    navigation.navigate("MapView", {
      profile: driverData,
      routeStatus: routeStatus,
    });
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
      <NotificationBanner
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        onHide={() => setNotification((prev) => ({ ...prev, visible: false }))}
      />

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

        {currentLocation && (
          <View style={styles.mapPreviewContainer}>
            <View style={styles.mapThumbnail}>
              <MapView
                provider={PROVIDER_DEFAULT}
                style={styles.thumbnailMap}
                region={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                  }}
                  image={require("../../ApplicationAssets/truck-icon.png")}
                />
              </MapView>

              <TouchableOpacity
                style={styles.viewMapButton}
                onPress={navigateToMapView}
              >
                <Icon name="maximize" size={16} color={COLORS.white} />
                <CustomText style={styles.viewMapText}>
                  View Full Map
                </CustomText>
              </TouchableOpacity>
            </View>

            <View style={styles.locationInfo}>
              <View style={styles.locationRow}>
                <Icon name="map-pin" size={18} color={COLORS.primary} />
                <CustomText style={styles.locationText}>
                  Current Location
                </CustomText>
              </View>
              <CustomText style={styles.locationUpdateText}>
                Last updated: {new Date().toLocaleTimeString()}
              </CustomText>
            </View>
          </View>
        )}

        <View style={styles.routeControlCard}>
          <View style={styles.routeHeaderRow}>
            <CustomText style={styles.routeTitle}>Route Status</CustomText>
            <View
              style={[
                styles.statusBadge,
                routeStatus === "active"
                  ? styles.activeBadge
                  : routeStatus === "paused"
                  ? styles.pausedBadge
                  : styles.inactiveBadge,
              ]}
            >
              <CustomText
                style={[
                  styles.statusBadgeText,
                  {
                    color:
                      routeStatus === "active"
                        ? "#4CAF50"
                        : routeStatus === "paused"
                        ? "#FF9800"
                        : "#9E9E9E",
                  },
                ]}
              >
                {routeStatus === "active"
                  ? "ACTIVE"
                  : routeStatus === "paused"
                  ? "PAUSED"
                  : routeStatus === "completed"
                  ? "COMPLETED"
                  : "INACTIVE"}
              </CustomText>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.buttonRow}>
            {(routeStatus === "idle" || routeStatus === "completed") && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleStartRoute}
              >
                <Icon name="play" size={20} color={COLORS.white} />
                <CustomText style={styles.actionButtonText}>
                  Start Route
                </CustomText>
              </TouchableOpacity>
            )}

            {routeStatus === "active" && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.pauseButton]}
                  onPress={handlePauseRoute}
                >
                  <Icon name="pause" size={20} color={COLORS.white} />
                  <CustomText style={styles.actionButtonText}>Pause</CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.stopButton]}
                  onPress={confirmStopRoute}
                >
                  <Icon name="square" size={20} color={COLORS.white} />
                  <CustomText style={styles.actionButtonText}>
                    End Route
                  </CustomText>
                </TouchableOpacity>
              </>
            )}

            {routeStatus === "paused" && (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleResumeRoute}
                >
                  <Icon name="play" size={20} color={COLORS.white} />
                  <CustomText style={styles.actionButtonText}>
                    Resume
                  </CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.stopButton]}
                  onPress={confirmStopRoute}
                >
                  <Icon name="square" size={20} color={COLORS.white} />
                  <CustomText style={styles.actionButtonText}>
                    End Route
                  </CustomText>
                </TouchableOpacity>
              </>
            )}
          </View>
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
  mapPreviewContainer: {
    marginBottom: 20,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  mapThumbnail: {
    height: 150,
    width: "100%",
    position: "relative",
  },
  thumbnailMap: {
    ...StyleSheet.absoluteFillObject,
  },
  viewMapButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  viewMapText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 13,
    marginLeft: 4,
  },
  locationInfo: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderGray,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.black,
  },
  locationUpdateText: {
    fontSize: 12,
    color: COLORS.textGray,
    marginLeft: 26,
  },
  routeControlCard: {
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
  routeHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: "#E8F5E9",
  },
  pausedBadge: {
    backgroundColor: "#FFF3E0",
  },
  inactiveBadge: {
    backgroundColor: "#ECEFF1",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  pauseButton: {
    backgroundColor: "#FF9800",
  },
  stopButton: {
    backgroundColor: "#F44336",
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
});
