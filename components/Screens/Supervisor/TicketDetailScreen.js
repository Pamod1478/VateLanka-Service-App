import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Linking,
} from "react-native";
import { COLORS } from "../../utils/Constants";
import CustomText from "../../utils/CustomText";
import Icon from "react-native-vector-icons/Feather";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import NotificationBanner from "../../utils/NotificationBanner";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "../../utils/firebaseConfig";
import { makePhoneCall } from "../../utils/phoneUtils";
import CustomConfirmDialog from "../../utils/CustomConfirmDialog";

export default function TicketDetailScreen({ route, navigation }) {
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
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success",
  });
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [confirmDialogProps, setConfirmDialogProps] = useState({
    title: "",
    message: "",
    confirmText: "",
    iconName: "alert-triangle",
    iconColor: COLORS.notificationYellow,
    confirmButtonColor: COLORS.errorbanner,
    onConfirm: () => {},
  });

  const mapRef = useRef(null);

  useEffect(() => {
    const fetchLatestTicket = async () => {
      try {
        setLoading(true);
        const ticketRef = doc(
          firestore,
          `municipalCouncils/${profile.municipalCouncil}/Districts/${profile.district}/Wards/${profile.ward}/tickets/${ticket.id}`
        );

        const ticketDoc = await getDoc(ticketRef);
        if (ticketDoc.exists()) {
          const data = ticketDoc.data();
          setTicket({
            id: ticketDoc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            resolvedAt: data.resolvedAt?.toDate(),
          });
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching ticket:", error);
        showNotification("Failed to load ticket details", "error");
        setLoading(false);
      }
    };

    fetchLatestTicket();
  }, [ticket.id, profile]);

  const showNotification = (message, type = "error") => {
    setNotification({
      visible: true,
      message,
      type,
    });
  };

  const handleCallUser = () => {
    if (!ticket.phoneNumber) {
      showNotification("User phone number not available", "error");
      return;
    }

    makePhoneCall(
      ticket.phoneNumber,
      () => console.log("Calling user"),
      (error) => showNotification(error, "error")
    );
  };

  const handleAssignTicket = () => {
    const serializedTicket = {
      ...ticket,
      createdAt: ticket.createdAt ? ticket.createdAt.toISOString() : null,
      updatedAt: ticket.updatedAt ? ticket.updatedAt.toISOString() : null,
      resolvedAt: ticket.resolvedAt ? ticket.resolvedAt.toISOString() : null,
    };
    navigation.navigate("AssignTicket", { ticket: serializedTicket, profile });
  };

  const handleUpdateStatus = (newStatus) => {
    let dialogProps = {
      title: "",
      message: "",
      confirmText: "",
      iconName: "alert-triangle",
      iconColor: COLORS.notificationYellow,
      confirmButtonColor: COLORS.errorbanner,
      onConfirm: async () => {
        try {
          setUpdating(true);
          const ticketRef = doc(
            firestore,
            `municipalCouncils/${profile.municipalCouncil}/Districts/${profile.district}/Wards/${profile.ward}/tickets/${ticket.id}`
          );

          const updateData = {
            status: newStatus,
            updatedAt: serverTimestamp(),
          };

          if (newStatus === "resolved") {
            updateData.resolvedAt = serverTimestamp();
          }

          await updateDoc(ticketRef, updateData);

          setTicket((prev) => ({
            ...prev,
            status: newStatus,
            updatedAt: new Date(),
            ...(newStatus === "resolved" ? { resolvedAt: new Date() } : {}),
          }));

          showNotification(`Ticket ${newStatus} successfully`, "success");
          setUpdating(false);
        } catch (error) {
          console.error("Error updating ticket status:", error);
          showNotification("Failed to update ticket status", "error");
          setUpdating(false);
        }
      },
    };

    if (newStatus === "resolved") {
      dialogProps = {
        ...dialogProps,
        title: "Resolve Ticket",
        message: "Are you sure you want to mark this ticket as resolved?",
        confirmText: "Resolve",
        iconName: "check-circle",
        iconColor: COLORS.successbanner,
        confirmButtonColor: COLORS.successbanner,
      };
    } else if (newStatus === "cancelled") {
      dialogProps = {
        ...dialogProps,
        title: "Cancel Ticket",
        message:
          "Are you sure you want to cancel this ticket? This cannot be undone.",
        confirmText: "Cancel Ticket",
        iconName: "x-circle",
        iconColor: COLORS.errorbanner,
        confirmButtonColor: COLORS.errorbanner,
      };
    } else {
      dialogProps = {
        ...dialogProps,
        title: "Update Status",
        message: `Are you sure you want to change the status to ${newStatus}?`,
        confirmText: "Update",
      };
    }

    setConfirmDialogProps(dialogProps);
    setConfirmDialogVisible(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return COLORS.notificationYellow;
      case "assigned":
        return COLORS.primary;
      case "resolved":
        return COLORS.successbanner;
      case "cancelled":
        return COLORS.errorbanner;
      default:
        return COLORS.textGray;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "assigned":
        return "Assigned";
      case "resolved":
        return "Resolved";
      case "cancelled":
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
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
        <CustomText style={styles.headerTitle}>Ticket Details</CustomText>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={styles.ticketIdContainer}>
                <Icon name="hash" size={16} color={COLORS.textGray} />
                <CustomText style={styles.ticketId}>{ticket.id}</CustomText>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: getStatusColor(ticket.status) + "20",
                    borderColor: getStatusColor(ticket.status),
                  },
                ]}
              >
                <CustomText
                  style={[
                    styles.statusText,
                    { color: getStatusColor(ticket.status) },
                  ]}
                >
                  {getStatusText(ticket.status)}
                </CustomText>
              </View>
            </View>

            <View style={styles.issueContainer}>
              <CustomText style={styles.issueTypeLabel}>Issue Type:</CustomText>
              <CustomText style={styles.issueType}>
                {ticket.issueType}
              </CustomText>
            </View>

            <View style={styles.wasteTypeContainer}>
              <CustomText style={styles.wasteTypeLabel}>Waste Type:</CustomText>
              <CustomText style={styles.wasteType}>
                {ticket.wasteType}
              </CustomText>
            </View>

            <View style={styles.dateContainer}>
              <View style={styles.dateRow}>
                <Icon name="calendar" size={16} color={COLORS.textGray} />
                <CustomText style={styles.dateLabel}>Created:</CustomText>
                <CustomText style={styles.dateText}>
                  {formatDate(ticket.createdAt)}
                </CustomText>
              </View>

              {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                <View style={styles.dateRow}>
                  <Icon name="edit" size={16} color={COLORS.textGray} />
                  <CustomText style={styles.dateLabel}>Updated:</CustomText>
                  <CustomText style={styles.dateText}>
                    {formatDate(ticket.updatedAt)}
                  </CustomText>
                </View>
              )}

              {ticket.resolvedAt && (
                <View style={styles.dateRow}>
                  <Icon name="check" size={16} color={COLORS.textGray} />
                  <CustomText style={styles.dateLabel}>Resolved:</CustomText>
                  <CustomText style={styles.dateText}>
                    {formatDate(ticket.resolvedAt)}
                  </CustomText>
                </View>
              )}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="user" size={18} color={COLORS.primary} />
              <CustomText style={styles.sectionTitle}>
                User Information
              </CustomText>
            </View>

            <View style={styles.sectionContent}>
              <View style={styles.infoRow}>
                <CustomText style={styles.infoLabel}>Name:</CustomText>
                <CustomText style={styles.infoValue}>
                  {ticket.userName || "Anonymous"}
                </CustomText>
              </View>

              {ticket.userEmail && (
                <View style={styles.infoRow}>
                  <CustomText style={styles.infoLabel}>Email:</CustomText>
                  <CustomText style={styles.infoValue}>
                    {ticket.userEmail}
                  </CustomText>
                </View>
              )}

              {ticket.phoneNumber && (
                <View style={styles.infoRow}>
                  <CustomText style={styles.infoLabel}>Phone:</CustomText>
                  <View style={styles.phoneContainer}>
                    <CustomText style={styles.infoValue}>
                      {ticket.phoneNumber}
                    </CustomText>
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={handleCallUser}
                    >
                      <MaterialIcon
                        name="call"
                        size={16}
                        color={COLORS.white}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>

          {ticket.notes && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Icon name="file-text" size={18} color={COLORS.primary} />
                <CustomText style={styles.sectionTitle}>Notes</CustomText>
              </View>

              <View style={styles.notesContainer}>
                <CustomText style={styles.notesText}>{ticket.notes}</CustomText>
              </View>
            </View>
          )}

          {ticket.homeLocation && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Icon name="map-pin" size={18} color={COLORS.primary} />
                <CustomText style={styles.sectionTitle}>Location</CustomText>
              </View>

              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  provider={PROVIDER_DEFAULT}
                  style={styles.map}
                  initialRegion={{
                    latitude: ticket.homeLocation.latitude,
                    longitude: ticket.homeLocation.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: ticket.homeLocation.latitude,
                      longitude: ticket.homeLocation.longitude,
                    }}
                    title={ticket.userName || "User Location"}
                  />
                </MapView>
              </View>

              <View style={styles.coordinatesContainer}>
                <Icon name="map" size={16} color={COLORS.textGray} />
                <CustomText style={styles.coordinatesText}>
                  {ticket.homeLocation.latitude.toFixed(6)},{" "}
                  {ticket.homeLocation.longitude.toFixed(6)}
                </CustomText>
              </View>
            </View>
          )}

          <View style={styles.actionsContainer}>
            {ticket.status === "pending" && (
              <TouchableOpacity
                style={[styles.actionButton, styles.assignButton]}
                onPress={handleAssignTicket}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <MaterialIcon
                      name="assignment-ind"
                      size={20}
                      color={COLORS.white}
                    />
                    <CustomText style={styles.actionButtonText}>
                      Assign to Driver
                    </CustomText>
                  </>
                )}
              </TouchableOpacity>
            )}

            {ticket.status === "assigned" && (
              <TouchableOpacity
                style={[styles.actionButton, styles.resolveButton]}
                onPress={() => handleUpdateStatus("resolved")}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <MaterialIcon
                      name="check-circle"
                      size={20}
                      color={COLORS.white}
                    />
                    <CustomText style={styles.actionButtonText}>
                      Mark as Resolved
                    </CustomText>
                  </>
                )}
              </TouchableOpacity>
            )}

            {(ticket.status === "pending" || ticket.status === "assigned") && (
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleUpdateStatus("cancelled")}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <MaterialIcon
                      name="cancel"
                      size={20}
                      color={COLORS.white}
                    />
                    <CustomText style={styles.actionButtonText}>
                      Cancel Ticket
                    </CustomText>
                  </>
                )}
              </TouchableOpacity>
            )}

            {ticket.status === "resolved" && (
              <View style={styles.resolvedContainer}>
                <Icon
                  name="check-circle"
                  size={24}
                  color={COLORS.successbanner}
                />
                <CustomText style={styles.resolvedText}>
                  This ticket has been resolved on{" "}
                  {formatDate(ticket.resolvedAt)}
                </CustomText>
              </View>
            )}

            {ticket.status === "cancelled" && (
              <View style={styles.cancelledContainer}>
                <Icon name="x-circle" size={24} color={COLORS.errorbanner} />
                <CustomText style={styles.cancelledText}>
                  This ticket has been cancelled
                </CustomText>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <CustomConfirmDialog
        visible={confirmDialogVisible}
        title={confirmDialogProps.title}
        message={confirmDialogProps.message}
        confirmText={confirmDialogProps.confirmText}
        cancelText="Cancel"
        onConfirm={() => {
          setConfirmDialogVisible(false);
          confirmDialogProps.onConfirm();
        }}
        onCancel={() => setConfirmDialogVisible(false)}
        iconName={confirmDialogProps.iconName}
        iconColor={confirmDialogProps.iconColor}
        confirmButtonColor={confirmDialogProps.confirmButtonColor}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 15,
  },
  statusCard: {
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
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  ticketIdContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ticketId: {
    fontSize: 14,
    color: COLORS.textGray,
    marginLeft: 5,
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
  issueContainer: {
    marginBottom: 10,
  },
  issueTypeLabel: {
    fontSize: 14,
    color: COLORS.textGray,
    marginBottom: 4,
  },
  issueType: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
  },
  wasteTypeContainer: {
    marginBottom: 15,
  },
  wasteTypeLabel: {
    fontSize: 14,
    color: COLORS.textGray,
    marginBottom: 4,
  },
  wasteType: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.primary,
  },
  dateContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderGray,
    paddingTop: 10,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  dateLabel: {
    fontSize: 14,
    color: COLORS.textGray,
    marginLeft: 6,
    marginRight: 5,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.black,
  },
  sectionCard: {
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginLeft: 10,
  },
  sectionContent: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    padding: 12,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textGray,
    width: 60,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.black,
    flex: 1,
  },
  phoneContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  callButton: {
    backgroundColor: COLORS.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  notesContainer: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    padding: 12,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 10,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  coordinatesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  coordinatesText: {
    fontSize: 12,
    color: COLORS.textGray,
    marginLeft: 5,
  },
  actionsContainer: {
    marginVertical: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  assignButton: {
    backgroundColor: COLORS.primary,
  },
  resolveButton: {
    backgroundColor: COLORS.successbanner,
  },
  cancelButton: {
    backgroundColor: COLORS.errorbanner,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  resolvedContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bg1,
    padding: 15,
    borderRadius: 8,
  },
  resolvedText: {
    color: COLORS.label1,
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
  },
  cancelledContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 15,
    borderRadius: 8,
  },
  cancelledText: {
    color: COLORS.errorbanner,
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
  },
});
