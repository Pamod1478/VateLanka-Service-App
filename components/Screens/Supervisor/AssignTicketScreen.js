import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { COLORS } from "../../utils/Constants";
import CustomText from "../../utils/CustomText";
import Icon from "react-native-vector-icons/Feather";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import NotificationBanner from "../../utils/NotificationBanner";
import { firestore } from "../../utils/firebaseConfig";
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import CustomConfirmDialog from "../../utils/CustomConfirmDialog";

export default function AssignTicketScreen({ route, navigation }) {
  const { ticket: initialTicket, profile } = route.params;

  const parsedTicket = {
    ...initialTicket,
    createdAt: initialTicket.createdAt
      ? new Date(initialTicket.createdAt)
      : null,
    updatedAt: initialTicket.updatedAt
      ? new Date(initialTicket.updatedAt)
      : null,
    resolvedAt: initialTicket.resolvedAt
      ? new Date(initialTicket.resolvedAt)
      : null,
  };

  const [ticket, setTicket] = useState(parsedTicket);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success",
  });
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setLoading(true);
        const trucksRef = collection(
          firestore,
          `municipalCouncils/${profile.municipalCouncil}/Districts/${profile.district}/Wards/${profile.ward}/supervisors/${profile.supervisorId}/trucks`
        );

        const trucksSnapshot = await getDocs(trucksRef);

        const driversList = trucksSnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              truckId: doc.id,
              driverName: data.driverName || "Unnamed Driver",
              numberPlate: data.numberPlate || "No Plate",
              phoneNumber: data.phoneNumber || null,
              status: data.routeStatus || "idle",
            };
          })
          .filter((driver) => driver.status !== "completed");

        setDrivers(driversList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching drivers:", error);
        showNotification("Failed to load available drivers", "error");
        setLoading(false);
      }
    };

    fetchDrivers();
  }, [profile]);

  const showNotification = (message, type = "error") => {
    setNotification({
      visible: true,
      message,
      type,
    });
  };

  const handleAssignToDriver = (driver) => {
    setSelectedDriver(driver);
    setConfirmDialogVisible(true);
  };

  const confirmAssignment = async () => {
    try {
      setAssigning(true);

      const ticketRef = doc(
        firestore,
        `municipalCouncils/${profile.municipalCouncil}/Districts/${profile.district}/Wards/${profile.ward}/tickets/${ticket.id}`
      );

      await updateDoc(ticketRef, {
        status: "assigned",
        assignedTo: selectedDriver.truckId,
        assignedDriver: selectedDriver.driverName,
        assignedByName: profile.name || "Unknown Supervisor",
        assignedBySupervisorId: profile.supervisorId,
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      showNotification(
        `Ticket assigned to ${selectedDriver.driverName} successfully`,
        "success"
      );

      setTimeout(() => {
        setAssigning(false);
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error("Error assigning ticket:", error);
      showNotification("Failed to assign ticket", "error");
      setAssigning(false);
    }
  };

  const getDriverStatusColor = (status) => {
    switch (status) {
      case "active":
        return COLORS.successbanner;
      case "paused":
        return COLORS.notificationYellow;
      case "idle":
        return COLORS.textGray;
      default:
        return COLORS.textGray;
    }
  };

  const getDriverStatusText = (status) => {
    switch (status) {
      case "active":
        return "Active";
      case "paused":
        return "Paused";
      case "idle":
        return "Idle";
      default:
        return "Unknown";
    }
  };

  const renderDriverItem = ({ item }) => (
    <TouchableOpacity
      style={styles.driverItem}
      onPress={() => handleAssignToDriver(item)}
      disabled={assigning}
    >
      <View style={styles.driverInfo}>
        <View style={styles.driverMain}>
          <CustomText style={styles.driverName}>{item.driverName}</CustomText>
          <CustomText style={styles.driverDetails}>
            Truck: {item.id} • {item.numberPlate}
          </CustomText>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: getDriverStatusColor(item.status) + "20",
              borderColor: getDriverStatusColor(item.status),
            },
          ]}
        >
          <CustomText
            style={[
              styles.statusText,
              { color: getDriverStatusColor(item.status) },
            ]}
          >
            {getDriverStatusText(item.status)}
          </CustomText>
        </View>
      </View>

      <View style={styles.assignButtonContainer}>
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => handleAssignToDriver(item)}
          disabled={assigning}
        >
          {assigning ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <MaterialIcon
                name="assignment-ind"
                size={18}
                color={COLORS.white}
              />
              <CustomText style={styles.assignButtonText}>Assign</CustomText>
            </>
          )}
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
        <CustomText style={styles.headerTitle}>Assign Ticket</CustomText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.ticketSummary}>
        <CustomText style={styles.issueType}>{ticket.issueType}</CustomText>
        <View style={styles.wasteTypeRow}>
          <Icon name="trash-2" size={16} color={COLORS.textGray} />
          <CustomText style={styles.wasteType}>{ticket.wasteType}</CustomText>
        </View>
        <View style={styles.userRow}>
          <Icon name="user" size={16} color={COLORS.textGray} />
          <CustomText style={styles.userName}>
            {ticket.userName || "Anonymous User"}
          </CustomText>
        </View>
      </View>

      <View style={styles.divider} />

      <CustomText style={styles.sectionTitle}>Available Drivers</CustomText>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={drivers}
          renderItem={renderDriverItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.driversListContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="users" size={40} color={COLORS.textGray} />
              <CustomText style={styles.emptyText}>
                No drivers available
              </CustomText>
              <CustomText style={styles.emptySubText}>
                Add drivers to your team before assigning tickets
              </CustomText>
            </View>
          }
        />
      )}

      <CustomConfirmDialog
        visible={confirmDialogVisible}
        title="Assign Ticket"
        message={
          selectedDriver
            ? `Are you sure you want to assign this ticket to ${selectedDriver.driverName}?`
            : ""
        }
        confirmText="Assign"
        cancelText="Cancel"
        onConfirm={() => {
          setConfirmDialogVisible(false);
          confirmAssignment();
        }}
        onCancel={() => setConfirmDialogVisible(false)}
        iconName="user-check"
        iconColor={COLORS.primary}
        confirmButtonColor={COLORS.primary}
      />
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
  ticketSummary: {
    padding: 15,
    backgroundColor: COLORS.secondary,
  },
  issueType: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 8,
  },
  wasteTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  wasteType: {
    fontSize: 14,
    color: COLORS.textGray,
    marginLeft: 8,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontSize: 14,
    color: COLORS.textGray,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderGray,
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginLeft: 15,
    marginBottom: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  driversListContainer: {
    padding: 15,
    paddingTop: 0,
  },
  driverItem: {
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
  driverInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  driverMain: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 4,
  },
  driverDetails: {
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
  assignButtonContainer: {
    alignItems: "flex-end",
  },
  assignButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  assignButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textGray,
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textGray,
    textAlign: "center",
    marginTop: 5,
  },
});
