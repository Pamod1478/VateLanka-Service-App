import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { COLORS } from "../../utils/Constants";
import CustomText from "../../utils/CustomText";
import Icon from "react-native-vector-icons/Feather";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import NotificationBanner from "../../utils/NotificationBanner";
import { makePhoneCall } from "../../utils/phoneUtils";
import { subscribeToSupervisorTrucks } from "../../services/firebaseFirestore";

export default function TrucksList({ route, navigation }) {
  const { profile } = route.params;
  const [trucks, setTrucks] = useState([]);
  const [filteredTrucks, setFilteredTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    const unsubscribe = subscribeToSupervisorTrucks(
      profile.supervisorId,
      profile.municipalCouncil,
      profile.district,
      profile.ward,
      (trucksData) => {
        setTrucks(trucksData || []);
        setFilteredTrucks(trucksData || []);
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
    applyFilters();
  }, [trucks, searchQuery, statusFilter]);

  const applyFilters = () => {
    let filtered = [...trucks];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (truck) =>
          (truck.driverName &&
            truck.driverName.toLowerCase().includes(query)) ||
          truck.id.toLowerCase().includes(query) ||
          (truck.numberPlate && truck.numberPlate.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((truck) => truck.routeStatus === statusFilter);
    }

    setFilteredTrucks(filtered);
  };

  const showNotification = (message, type = "error") => {
    setNotification({
      visible: true,
      message,
      type,
    });
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
        return "Inactive";
    }
  };

  const renderTruckItem = ({ item }) => (
    <TouchableOpacity
      style={styles.truckItem}
      onPress={() => navigation.navigate("TruckDetail", { truck: item })}
    >
      <View style={styles.truckInfo}>
        <View style={styles.truckMain}>
          <CustomText style={styles.truckName}>
            {item.driverName || "Unnamed Driver"}
          </CustomText>
          <CustomText style={styles.truckId}>
            {item.id} • {item.numberPlate || "No plate"}
          </CustomText>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: getTruckStatusColor(item.routeStatus) + "20",
              borderColor: getTruckStatusColor(item.routeStatus),
            },
          ]}
        >
          <CustomText
            style={[
              styles.statusText,
              {
                color: getTruckStatusColor(item.routeStatus),
              },
            ]}
          >
            {getTruckStatusText(item.routeStatus)}
          </CustomText>
        </View>
      </View>

      {item.currentLocation && (
        <View style={styles.locationRow}>
          <Icon name="map-pin" size={14} color={COLORS.textGray} />
          <CustomText style={styles.locationText}>
            Last seen at {new Date().toLocaleTimeString()}
          </CustomText>
        </View>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.callButton]}
          onPress={() => handleCallDriver(item)}
        >
          <MaterialIcon name="call" size={16} color={COLORS.white} />
          <CustomText style={styles.actionText}>Call</CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.trackButton]}
          onPress={() =>
            navigation.navigate("TruckMap", { profile, trucks: [item] })
          }
        >
          <MaterialIcon name="location-on" size={16} color={COLORS.white} />
          <CustomText style={styles.actionText}>Track</CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.detailsButton]}
          onPress={() => navigation.navigate("TruckDetail", { truck: item })}
        >
          <MaterialIcon name="info" size={16} color={COLORS.white} />
          <CustomText style={styles.actionText}>Details</CustomText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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
        <CustomText style={styles.headerTitle}>All Trucks</CustomText>
        <TouchableOpacity
          onPress={() => navigation.navigate("TruckMap", { profile, trucks })}
        >
          <Icon name="map" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Icon name="search" size={20} color={COLORS.textGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search trucks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="x" size={20} color={COLORS.textGray} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === "all" && styles.activeFilter,
            ]}
            onPress={() => setStatusFilter("all")}
          >
            <CustomText
              style={[
                styles.filterText,
                statusFilter === "all" && styles.activeFilterText,
              ]}
            >
              All
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === "active" && styles.activeFilter,
            ]}
            onPress={() => setStatusFilter("active")}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: COLORS.successbanner },
              ]}
            />
            <CustomText
              style={[
                styles.filterText,
                statusFilter === "active" && styles.activeFilterText,
              ]}
            >
              Active
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === "paused" && styles.activeFilter,
            ]}
            onPress={() => setStatusFilter("paused")}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: COLORS.notificationYellow },
              ]}
            />
            <CustomText
              style={[
                styles.filterText,
                statusFilter === "paused" && styles.activeFilterText,
              ]}
            >
              Paused
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === "completed" && styles.activeFilter,
            ]}
            onPress={() => setStatusFilter("completed")}
          >
            <View
              style={[styles.statusDot, { backgroundColor: COLORS.completed }]}
            />
            <CustomText
              style={[
                styles.filterText,
                statusFilter === "completed" && styles.activeFilterText,
              ]}
            >
              Completed
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === "idle" && styles.activeFilter,
            ]}
            onPress={() => setStatusFilter("idle")}
          >
            <View
              style={[styles.statusDot, { backgroundColor: COLORS.textGray }]}
            />
            <CustomText
              style={[
                styles.filterText,
                statusFilter === "idle" && styles.activeFilterText,
              ]}
            >
              Inactive
            </CustomText>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTrucks}
          renderItem={renderTruckItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="truck" size={40} color={COLORS.textGray} />
              <CustomText style={styles.emptyText}>
                {searchQuery || statusFilter !== "all"
                  ? "No trucks match your filters"
                  : "No trucks assigned yet"}
              </CustomText>
            </View>
          }
        />
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
  },
  searchContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    color: COLORS.black,
  },
  filtersContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
  },
  activeFilter: {
    backgroundColor: COLORS.primary + "20",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.textGray,
  },
  activeFilterText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  listContainer: {
    padding: 15,
  },
  truckItem: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  truckInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
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
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textGray,
    marginLeft: 6,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  callButton: {
    backgroundColor: COLORS.primary,
  },
  trackButton: {
    backgroundColor: COLORS.primary,
  },
  detailsButton: {
    backgroundColor: COLORS.completed,
  },
  actionText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textGray,
    textAlign: "center",
    marginTop: 10,
  },
});
