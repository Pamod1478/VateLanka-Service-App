import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Dimensions,
  Linking,
} from "react-native";
import { COLORS } from "../../utils/Constants";
import CustomText from "../../utils/CustomText";
import Icon from "react-native-vector-icons/Feather";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import NotificationBanner from "../../utils/NotificationBanner";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { doc, onSnapshot } from "firebase/firestore";
import { makePhoneCall, sendTextMessage } from "../../utils/phoneUtils";
import { firestore } from "../../utils/firebaseConfig";

export default function TruckDetail({ route, navigation }) {
  const { truck: initialTruck } = route.params;
  const [truck, setTruck] = useState(initialTruck);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const mapRef = useRef(null);

  useEffect(() => {
    if (!truck || !truck.supervisorId) {
      return () => {};
    }

    try {
      const truckRef = doc(
        firestore,
        `municipalCouncils/${truck.municipalCouncil}/Districts/${truck.district}/Wards/${truck.ward}/supervisors/${truck.supervisorId}/trucks/${truck.id}`
      );

      const unsubscribe = onSnapshot(
        truckRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setTruck({ ...snapshot.data(), id: snapshot.id });
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error subscribing to truck updates:", error);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("Error setting up truck subscription:", error);
      setLoading(false);
      return () => {};
    }
  }, [truck.id, truck.supervisorId]);

  const getRouteStatusInfo = (status) => {
    switch (status) {
      case "active":
        return {
          color: COLORS.label1,
          backgroundColor: COLORS.bg1,
          text: "Active",
          icon: "play-circle",
        };
      case "paused":
        return {
          color: COLORS.label2,
          backgroundColor: COLORS.bg2,
          text: "Paused",
          icon: "pause-circle",
        };
      case "completed":
        return {
          color: COLORS.label3,
          backgroundColor: COLORS.bg3,
          text: "Completed",
          icon: "check-circle",
        };
      default:
        return {
          color: COLORS.label4,
          backgroundColor: COLORS.bg4,
          text: "Inactive",
          icon: "circle",
        };
    }
  };

  const handleCallDriver = () => {
    makePhoneCall(
      truck.phoneNumber,
      () => showNotification(`Calling driver: ${truck.driverName}`, "success"),
      (errorMsg) => showNotification(errorMsg, "error")
    );
  };

  const handleSendMessage = () => {
    sendTextMessage(
      truck.phoneNumber,
      () =>
        showNotification(`Sending message to: ${truck.driverName}`, "success"),
      (errorMsg) => showNotification(errorMsg, "error")
    );
  };

  const showNotification = (message, type = "error") => {
    setNotification({
      visible: true,
      message,
      type,
    });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Not available";

    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return "Invalid date";
    }
  };

  const routeStatus = getRouteStatusInfo(truck.routeStatus || "idle");

  return (
    <SafeAreaView style={styles.container}>
      <NotificationBanner
        {...notification}
        onHide={() => setNotification((prev) => ({ ...prev, visible: false }))}
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <CustomText style={styles.headerTitle}>Truck Details</CustomText>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("TruckMap", {
              profile: {
                supervisorId: truck.supervisorId,
                municipalCouncil: truck.municipalCouncil,
                district: truck.district,
                ward: truck.ward,
              },
              trucks: [truck],
            })
          }
          style={styles.mapButton}
        >
          <Icon name="map" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.truckInfoCard}>
            <View style={styles.truckHeaderRow}>
              <View style={styles.truckTitleContainer}>
                <CustomText style={styles.truckName}>
                  {truck.driverName || "Unnamed Driver"}
                </CustomText>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: routeStatus.backgroundColor,
                      borderColor: routeStatus.color,
                    },
                  ]}
                >
                  <Icon
                    name={routeStatus.icon}
                    size={14}
                    color={routeStatus.color}
                    style={{ marginRight: 4 }}
                  />
                  <CustomText
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: routeStatus.color,
                    }}
                  >
                    {routeStatus.text}
                  </CustomText>
                </View>
              </View>

              <View style={styles.truckDetailsRow}>
                <Icon
                  name="truck"
                  size={16}
                  color={COLORS.textGray}
                  style={{ marginRight: 6 }}
                />
                <CustomText style={styles.truckIdText}>{truck.id}</CustomText>
              </View>

              {truck.numberPlate && (
                <View style={styles.truckDetailsRow}>
                  <Icon
                    name="hash"
                    size={16}
                    color={COLORS.textGray}
                    style={{ marginRight: 6 }}
                  />
                  <CustomText style={styles.numberPlateText}>
                    {truck.numberPlate}
                  </CustomText>
                </View>
              )}
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.callButton]}
                onPress={handleCallDriver}
              >
                <MaterialIcon name="call" size={22} color={COLORS.white} />
                <CustomText style={styles.actionText}>Call Driver</CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.messageButton]}
                onPress={handleSendMessage}
              >
                <MaterialIcon name="message" size={22} color={COLORS.white} />
                <CustomText style={styles.actionText}>Message</CustomText>
              </TouchableOpacity>
            </View>
          </View>

          {truck.currentLocation && (
            <View style={styles.mapCard}>
              <View style={styles.cardHeader}>
                <Icon name="map-pin" size={18} color={COLORS.primary} />
                <CustomText style={styles.cardTitle}>
                  Current Location
                </CustomText>
              </View>

              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  provider={PROVIDER_DEFAULT}
                  style={styles.map}
                  initialRegion={{
                    latitude: truck.currentLocation.latitude,
                    longitude: truck.currentLocation.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: truck.currentLocation.latitude,
                      longitude: truck.currentLocation.longitude,
                    }}
                    title={truck.driverName || "Driver"}
                    description={truck.numberPlate || truck.id}
                  >
                    <Image
                      source={require("../../ApplicationAssets/truck-icon.png")}
                      style={styles.markerImage}
                    />
                  </Marker>
                </MapView>

                <TouchableOpacity
                  style={styles.viewFullMapButton}
                  onPress={() =>
                    navigation.navigate("TruckMap", {
                      profile: {
                        supervisorId: truck.supervisorId,
                        municipalCouncil: truck.municipalCouncil,
                        district: truck.district,
                        ward: truck.ward,
                      },
                      trucks: [truck],
                    })
                  }
                >
                  <Icon name="maximize" size={16} color={COLORS.white} />
                  <CustomText style={styles.viewFullMapText}>
                    View Full Map
                  </CustomText>
                </TouchableOpacity>
              </View>

              <View style={styles.locationDetails}>
                <View style={styles.locationDetail}>
                  <CustomText style={styles.locationLabel}>
                    Coordinates:
                  </CustomText>
                  <CustomText style={styles.locationValue}>
                    {truck.currentLocation.latitude.toFixed(6)},{" "}
                    {truck.currentLocation.longitude.toFixed(6)}
                  </CustomText>
                </View>

                <View style={styles.locationDetail}>
                  <CustomText style={styles.locationLabel}>
                    Last updated:
                  </CustomText>
                  <CustomText style={styles.locationValue}>
                    {formatTimestamp(
                      truck.currentLocation.timestamp ||
                        truck.lastLocationUpdate?.toDate()
                    )}
                  </CustomText>
                </View>

                {truck.currentLocation.speed !== undefined && (
                  <View style={styles.locationDetail}>
                    <CustomText style={styles.locationLabel}>Speed:</CustomText>
                    <CustomText style={styles.locationValue}>
                      {(truck.currentLocation.speed * 3.6).toFixed(1)} km/h
                    </CustomText>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Icon name="info" size={18} color={COLORS.primary} />
              <CustomText style={styles.cardTitle}>Driver Details</CustomText>
            </View>

            <View style={styles.detailsSection}>
              {truck.driverName && (
                <View style={styles.detailRow}>
                  <CustomText style={styles.detailLabel}>
                    Driver Name:
                  </CustomText>
                  <CustomText style={styles.detailValue}>
                    {truck.driverName}
                  </CustomText>
                </View>
              )}

              {truck.phoneNumber && (
                <View style={styles.detailRow}>
                  <CustomText style={styles.detailLabel}>
                    Phone Number:
                  </CustomText>
                  <CustomText style={styles.detailValue}>
                    {truck.phoneNumber}
                  </CustomText>
                </View>
              )}

              {truck.email && (
                <View style={styles.detailRow}>
                  <CustomText style={styles.detailLabel}>Email:</CustomText>
                  <CustomText style={styles.detailValue}>
                    {truck.email}
                  </CustomText>
                </View>
              )}

              <View style={styles.detailRow}>
                <CustomText style={styles.detailLabel}>Ward:</CustomText>
                <CustomText style={styles.detailValue}>
                  {truck.ward || "Not specified"}
                </CustomText>
              </View>

              <View style={styles.detailRow}>
                <CustomText style={styles.detailLabel}>District:</CustomText>
                <CustomText style={styles.detailValue}>
                  {truck.district || "Not specified"}
                </CustomText>
              </View>

              <View style={styles.detailRow}>
                <CustomText style={styles.detailLabel}>
                  Municipal Council:
                </CustomText>
                <CustomText style={styles.detailValue}>
                  {truck.municipalCouncil || "Not specified"}
                </CustomText>
              </View>
            </View>
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Icon name="truck" size={18} color={COLORS.primary} />
              <CustomText style={styles.cardTitle}>Vehicle Details</CustomText>
            </View>

            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <CustomText style={styles.detailLabel}>Truck ID:</CustomText>
                <CustomText style={styles.detailValue}>{truck.id}</CustomText>
              </View>

              <View style={styles.detailRow}>
                <CustomText style={styles.detailLabel}>
                  Number Plate:
                </CustomText>
                <CustomText style={styles.detailValue}>
                  {truck.numberPlate || "Not specified"}
                </CustomText>
              </View>

              <View style={styles.detailRow}>
                <CustomText style={styles.detailLabel}>
                  Vehicle Type:
                </CustomText>
                <CustomText style={styles.detailValue}>
                  {truck.vehicleType || "Standard"}
                </CustomText>
              </View>

              <View style={styles.detailRow}>
                <CustomText style={styles.detailLabel}>Status:</CustomText>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: routeStatus.backgroundColor },
                  ]}
                >
                  <CustomText
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: routeStatus.color,
                    }}
                  >
                    {routeStatus.text}
                  </CustomText>
                </View>
              </View>

              <View style={styles.detailRow}>
                <CustomText style={styles.detailLabel}>Last Update:</CustomText>
                <CustomText style={styles.detailValue}>
                  {formatTimestamp(truck.lastLocationUpdate?.toDate())}
                </CustomText>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 15,
    marginRight: 15,
  },
  backButton: {
    paddingRight: 12,
    marginTop: 15,
  },
  mapButton: {
    marginTop: 16,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  truckInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  truckHeaderRow: {
    marginBottom: 20,
  },
  truckTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  truckName: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  truckDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  truckIdText: {
    fontSize: 14,
    color: COLORS.black,
  },
  numberPlateText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  callButton: {
    backgroundColor: COLORS.primary,
  },
  messageButton: {
    backgroundColor: COLORS.completed,
  },
  actionText: {
    color: COLORS.white,
    fontWeight: "600",
    marginLeft: 8,
  },
  mapCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginLeft: 10,
  },
  mapContainer: {
    height: 200,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 15,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  viewFullMapButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  viewFullMapText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  locationDetails: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    padding: 12,
  },
  locationDetail: {
    flexDirection: "row",
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.black,
    width: 100,
  },
  locationValue: {
    fontSize: 14,
    color: COLORS.textGray,
    flex: 1,
  },
  markerImage: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  detailsSection: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    padding: 12,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.black,
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.textGray,
    flex: 1,
  },
  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
});
