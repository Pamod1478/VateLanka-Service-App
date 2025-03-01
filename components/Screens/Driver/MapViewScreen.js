import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { COLORS } from "../../utils/Constants";
import CustomText from "../../utils/CustomText";
import Icon from "react-native-vector-icons/Feather";
import * as Location from "expo-location";

export default function MapViewScreen({ route, navigation }) {
  const { profile, routeStatus } = route.params;
  const [currentLocation, setCurrentLocation] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    let locationSubscription;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({});
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              distanceInterval: 10,
              timeInterval: 10000,
            },
            (location) => {
              setCurrentLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
            }
          );
        }
      } catch (error) {
        console.error("Error setting up location:", error);
      }
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const centerOnLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <CustomText style={styles.headerTitle}>Live Route Tracking</CustomText>
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
              styles.statusText,
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
              ? "Active"
              : routeStatus === "paused"
              ? "Paused"
              : "Inactive"}
          </CustomText>
        </View>
      </View>

      {currentLocation && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            showsUserLocation={false}
            followsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={true}
            showsTraffic={true}
          >
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title={profile.driverName || "Your Location"}
              description={profile.numberPlate || "Current position"}
              image={require("../../ApplicationAssets/truck-icon.png")}
            />
          </MapView>

          <View style={styles.mapControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={centerOnLocation}
            >
              <Icon name="crosshair" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapControls: {
    position: "absolute",
    bottom: 24,
    right: 16,
  },
  controlButton: {
    backgroundColor: COLORS.white,
    borderRadius: 30,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
