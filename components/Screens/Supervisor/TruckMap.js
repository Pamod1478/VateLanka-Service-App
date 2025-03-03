import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { COLORS } from "../../utils/Constants";
import CustomText from "../../utils/CustomText";
import Icon from "react-native-vector-icons/Feather";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import NotificationBanner from "../../utils/NotificationBanner";
import { subscribeToSupervisorTrucks } from "../../services/firebaseFirestore";

export default function TruckMap({ route, navigation }) {
  const { profile, trucks: initialTrucks } = route.params;
  const [trucks, setTrucks] = useState(initialTrucks || []);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success",
  });
  const [loading, setLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState(null);

  const mapRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToSupervisorTrucks(
      profile.supervisorId,
      profile.municipalCouncil,
      profile.district,
      profile.ward,
      (trucksData) => {
        setTrucks(trucksData || []);
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [profile]);

  useEffect(() => {
    if (trucks.length > 0) {
      const trucksWithLocation = trucks.filter((t) => t.currentLocation);

      if (trucksWithLocation.length > 0) {
        const latitudes = trucksWithLocation.map(
          (t) => t.currentLocation.latitude
        );
        const longitudes = trucksWithLocation.map(
          (t) => t.currentLocation.longitude
        );

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
      } else {
        setMapRegion({
          latitude: 6.9271,
          longitude: 79.8612,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    }
  }, [trucks]);

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

  const handleTruckSelect = (truck) => {
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
    if (!phoneNumber) {
      showNotification("Driver phone number not available", "error");
      return;
    }

    showNotification(`Calling driver: ${truck.driverName}`, "success");
  };

  const showNotification = (message, type = "error") => {
    setNotification({
      visible: true,
      message,
      type,
    });
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
        onPress={() => handleTruckSelect(truck)}
      >
        <View
          style={[
            styles.markerContainer,
            {
              borderColor: getTruckStatusColor(truck.routeStatus),
            },
          ]}
        >
          <Icon
            name="truck"
            size={16}
            color={getTruckStatusColor(truck.routeStatus)}
          />
        </View>
      </Marker>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <NotificationBanner
        {...notification}
        onHide={() => setNotification((prev) => ({ ...prev, visible: false }))}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <CustomText style={styles.headerTitle}>Truck Tracking</CustomText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : mapRegion ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
          >
            {trucks.map(renderTruckMarker)}
          </MapView>
        ) : (
          <View style={styles.noDataContainer}>
            <Icon name="map-off" size={40} color={COLORS.textGray} />
            <CustomText style={styles.noDataText}>
              No location data available for trucks
            </CustomText>
          </View>
        )}
      </View>

      {selectedTruck && (
        <View style={styles.truckInfoCard}>
          <View style={styles.truckInfoHeader}>
            <View style={styles.truckTitleContainer}>
              <CustomText style={styles.truckName}>
                {selectedTruck.driverName || "Unnamed Driver"}
              </CustomText>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      getTruckStatusColor(selectedTruck.routeStatus) + "20",
                    borderColor: getTruckStatusColor(selectedTruck.routeStatus),
                  },
                ]}
              >
                <CustomText
                  style={[
                    styles.statusText,
                    {
                      color: getTruckStatusColor(selectedTruck.routeStatus),
                    },
                  ]}
                >
                  {selectedTruck.routeStatus || "Idle"}
                </CustomText>
              </View>
            </View>
            <CustomText style={styles.truckId}>
              {selectedTruck.id} • {selectedTruck.numberPlate || "No plate"}
            </CustomText>
          </View>

          <View style={styles.truckMetadata}>
            <View style={styles.metadataItem}>
              <Icon name="calendar" size={16} color={COLORS.textGray} />
              <CustomText style={styles.metadataText}>
                {new Date().toLocaleDateString()}
              </CustomText>
            </View>

            {selectedTruck.currentLocation && (
              <View style={styles.metadataItem}>
                <Icon name="map-pin" size={16} color={COLORS.textGray} />
                <CustomText style={styles.metadataText}>
                  {selectedTruck.currentLocation.latitude.toFixed(6)},
                  {selectedTruck.currentLocation.longitude.toFixed(6)}
                </CustomText>
              </View>
            )}
          </View>

          <View style={styles.truckActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCallDriver(selectedTruck)}
            >
              <MaterialIcon name="call" size={18} color={COLORS.white} />
              <CustomText style={styles.actionText}>Call Driver</CustomText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.viewDetailsButton]}
              onPress={() =>
                navigation.navigate("TruckDetail", { truck: selectedTruck })
              }
            >
              <MaterialIcon name="visibility" size={18} color={COLORS.white} />
              <CustomText style={styles.actionText}>View Details</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.legendContainer}>
        <CustomText style={styles.legendTitle}>Truck Status</CustomText>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: COLORS.successbanner },
              ]}
            />
            <CustomText style={styles.legendText}>Active</CustomText>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: COLORS.notificationYellow },
              ]}
            />
            <CustomText style={styles.legendText}>Paused</CustomText>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: COLORS.completed }]}
            />
            <CustomText style={styles.legendText}>Completed</CustomText>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: COLORS.textGray }]}
            />
            <CustomText style={styles.legendText}>Inactive</CustomText>
          </View>
        </View>
      </View>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    color: COLORS.textGray,
    textAlign: "center",
    marginTop: 10,
  },
  markerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
  },
  truckInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    margin: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  truckInfoHeader: {
    marginBottom: 10,
  },
  truckTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  truckName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
  },
  truckId: {
    fontSize: 14,
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
  truckMetadata: {
    marginVertical: 10,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 14,
    color: COLORS.textGray,
    marginLeft: 8,
  },
  truckActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  viewDetailsButton: {
    backgroundColor: COLORS.completed,
  },
  actionText: {
    color: COLORS.white,
    fontWeight: "600",
    marginLeft: 8,
  },
  legendContainer: {
    backgroundColor: COLORS.white,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderGray,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textGray,
  },
});
