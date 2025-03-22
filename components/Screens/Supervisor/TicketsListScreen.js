import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  ScrollView,
  SectionList,
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
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { Linking } from "react-native";

export default function TicketsListScreen({ route, navigation }) {
  const { profile } = route.params;
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [categorizedTickets, setCategorizedTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success",
  });
  const [recentTickets, setRecentTickets] = useState([]);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        if (!profile.municipalCouncil || !profile.district || !profile.ward) {
          console.log("Missing required profile data for Firestore query");
          setLoading(false);
          return () => {};
        }

        const ticketsRef = collection(
          firestore,
          `municipalCouncils/${profile.municipalCouncil}/Districts/${profile.district}/Wards/${profile.ward}/tickets`
        );

        const q = query(ticketsRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const ticketsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate(),
              updatedAt: doc.data().updatedAt?.toDate(),
              resolvedAt: doc.data().resolvedAt?.toDate(),
            }));
            setTickets(ticketsData);

            const last24Hours = new Date();
            last24Hours.setHours(last24Hours.getHours() - 24);
            setRecentTickets(
              ticketsData.filter(
                (t) => t.createdAt && t.createdAt > last24Hours
              )
            );

            setLoading(false);
          },
          (error) => {
            console.error("Error fetching tickets:", error);
            showNotification("Failed to load tickets", "error");
            setLoading(false);
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error("Error setting up tickets query:", error);
        setLoading(false);
        return () => {};
      }
    };

    loadTickets();
  }, [profile]);

  useEffect(() => {
    applyFilters();
  }, [tickets, searchQuery, statusFilter]);

  useEffect(() => {
    categorizeTickets(filteredTickets);
  }, [filteredTickets]);

  const categorizeTickets = (ticketsList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - today.getDay());

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const isSameDay = (date1, date2) => {
      if (!date1) return false;
      return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
      );
    };

    const sections = [
      {
        title: "Today",
        data: ticketsList.filter(
          (ticket) => ticket.createdAt && isSameDay(ticket.createdAt, today)
        ),
      },
      {
        title: "Yesterday",
        data: ticketsList.filter(
          (ticket) => ticket.createdAt && isSameDay(ticket.createdAt, yesterday)
        ),
      },
      {
        title: "This Week",
        data: ticketsList.filter(
          (ticket) =>
            ticket.createdAt &&
            ticket.createdAt >= thisWeekStart &&
            !isSameDay(ticket.createdAt, today) &&
            !isSameDay(ticket.createdAt, yesterday)
        ),
      },
      {
        title: "This Month",
        data: ticketsList.filter(
          (ticket) =>
            ticket.createdAt &&
            ticket.createdAt >= thisMonthStart &&
            ticket.createdAt < thisWeekStart
        ),
      },
      {
        title: "Older",
        data: ticketsList.filter(
          (ticket) => ticket.createdAt && ticket.createdAt < thisMonthStart
        ),
      },
    ];

    const nonEmptySections = sections.filter(
      (section) => section.data.length > 0
    );

    setCategorizedTickets(nonEmptySections);
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          (ticket.userName && ticket.userName.toLowerCase().includes(query)) ||
          (ticket.wasteType &&
            ticket.wasteType.toLowerCase().includes(query)) ||
          (ticket.issueType && ticket.issueType.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter);
    }

    setFilteredTickets(filtered);
  };

  const showNotification = (message, type = "error") => {
    setNotification({
      visible: true,
      message,
      type,
    });
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

  const formatTimeAgo = (date) => {
    if (!date) return "";

    const now = new Date();
    const seconds = Math.round((now - date) / 1000);

    if (seconds < 60) return "just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;

    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  };

  const handleTicketPress = (ticket) => {
    const serializedTicket = {
      ...ticket,
      createdAt: ticket.createdAt ? ticket.createdAt.toISOString() : null,
      updatedAt: ticket.updatedAt ? ticket.updatedAt.toISOString() : null,
      resolvedAt: ticket.resolvedAt ? ticket.resolvedAt.toISOString() : null,
    };
    navigation.navigate("TicketDetail", { ticket: serializedTicket, profile });
  };

  const renderTicketItem = ({ item }) => (
    <TouchableOpacity
      style={styles.ticketItem}
      onPress={() => handleTicketPress(item)}
    >
      <View style={styles.ticketHeader}>
        <View style={styles.ticketMain}>
          <CustomText style={styles.ticketType}>{item.issueType}</CustomText>
          <CustomText style={styles.ticketUser}>
            {item.userName || "Anonymous User"}
          </CustomText>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: getStatusColor(item.status) + "20",
              borderColor: getStatusColor(item.status),
            },
          ]}
        >
          <CustomText
            style={[
              styles.statusText,
              {
                color: getStatusColor(item.status),
              },
            ]}
          >
            {getStatusText(item.status)}
          </CustomText>
        </View>
      </View>

      <View style={styles.ticketInfoRow}>
        <Icon name="trash-2" size={16} color={COLORS.textGray} />
        <CustomText style={styles.wasteTypeText}>{item.wasteType}</CustomText>
      </View>

      <View style={styles.ticketInfoRow}>
        <Icon name="clock" size={16} color={COLORS.textGray} />
        <CustomText style={styles.timeText}>
          {formatDate(item.createdAt)}
        </CustomText>
      </View>

      <View style={styles.actionRow}>
        {item.phoneNumber && (
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={() => Linking.openURL(`tel:${item.phoneNumber}`)}
          >
            <MaterialIcon name="call" size={16} color={COLORS.white} />
            <CustomText style={styles.actionText}>Call</CustomText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => handleTicketPress(item)}
        >
          <MaterialIcon name="visibility" size={16} color={COLORS.white} />
          <CustomText style={styles.actionText}>View</CustomText>
        </TouchableOpacity>

        {item.status === "pending" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.assignButton]}
            onPress={() => {
              const serializedTicket = {
                ...item,
                createdAt: item.createdAt ? item.createdAt.toISOString() : null,
                updatedAt: item.updatedAt ? item.updatedAt.toISOString() : null,
                resolvedAt: item.resolvedAt
                  ? item.resolvedAt.toISOString()
                  : null,
              };
              navigation.navigate("AssignTicket", {
                ticket: serializedTicket,
                profile,
              });
            }}
          >
            <MaterialIcon name="assignment" size={16} color={COLORS.white} />
            <CustomText style={styles.actionText}>Assign</CustomText>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderRecentTicketItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recentTicketItem}
      onPress={() => handleTicketPress(item)}
    >
      <View style={styles.recentTicketHeader}>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        />
        <CustomText style={styles.recentTicketTime}>
          {formatTimeAgo(item.createdAt)}
        </CustomText>
      </View>
      <CustomText style={styles.recentTicketIssue} numberOfLines={1}>
        {item.issueType}
      </CustomText>
      <CustomText style={styles.recentTicketUser} numberOfLines={1}>
        {item.userName || "Anonymous"}
      </CustomText>
      <View style={styles.recentTicketWaste}>
        <Icon name="trash-2" size={12} color={COLORS.textGray} />
        <CustomText style={styles.recentTicketWasteText}>
          {item.wasteType}
        </CustomText>
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <CustomText style={styles.sectionHeaderText}>{title}</CustomText>
    </View>
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
        <CustomText style={styles.headerTitle}>Tickets</CustomText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Icon name="search" size={20} color={COLORS.textGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tickets..."
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
              statusFilter === "pending" && styles.activeFilter,
            ]}
            onPress={() => setStatusFilter("pending")}
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
                statusFilter === "pending" && styles.activeFilterText,
              ]}
            >
              Pending
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === "assigned" && styles.activeFilter,
            ]}
            onPress={() => setStatusFilter("assigned")}
          >
            <View
              style={[styles.statusDot, { backgroundColor: COLORS.primary }]}
            />
            <CustomText
              style={[
                styles.filterText,
                statusFilter === "assigned" && styles.activeFilterText,
              ]}
            >
              Assigned
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === "resolved" && styles.activeFilter,
            ]}
            onPress={() => setStatusFilter("resolved")}
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
                statusFilter === "resolved" && styles.activeFilterText,
              ]}
            >
              Resolved
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === "cancelled" && styles.activeFilter,
            ]}
            onPress={() => setStatusFilter("cancelled")}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: COLORS.errorbanner },
              ]}
            />
            <CustomText
              style={[
                styles.filterText,
                statusFilter === "cancelled" && styles.activeFilterText,
              ]}
            >
              Cancelled
            </CustomText>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          {recentTickets.length > 0 && (
            <View style={styles.recentTicketsContainer}>
              <View style={styles.recentTicketsHeader}>
                <Icon name="clock" size={16} color={COLORS.primary} />
                <CustomText style={styles.recentTicketsTitle}>
                  Recent Tickets (24h)
                </CustomText>
              </View>
              <FlatList
                data={recentTickets}
                renderItem={renderRecentTicketItem}
                keyExtractor={(item) => `recent-${item.id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentTicketsList}
              />
            </View>
          )}

          {categorizedTickets.length > 0 ? (
            <SectionList
              sections={categorizedTickets}
              keyExtractor={(item) => item.id}
              renderItem={renderTicketItem}
              renderSectionHeader={renderSectionHeader}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="inbox" size={40} color={COLORS.textGray} />
                  <CustomText style={styles.emptyText}>
                    {searchQuery || statusFilter !== "all"
                      ? "No tickets match your filters"
                      : "No tickets in your ward yet"}
                  </CustomText>
                </View>
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="inbox" size={40} color={COLORS.textGray} />
              <CustomText style={styles.emptyText}>
                {searchQuery || statusFilter !== "all"
                  ? "No tickets match your filters"
                  : "No tickets in your ward yet"}
              </CustomText>
            </View>
          )}
        </>
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
  recentTicketsContainer: {
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
    paddingBottom: 15,
  },
  recentTicketsHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  recentTicketsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginLeft: 6,
  },
  recentTicketsList: {
    paddingLeft: 15,
    paddingRight: 5,
  },
  recentTicketItem: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginRight: 10,
    width: 160,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  recentTicketHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recentTicketTime: {
    fontSize: 11,
    color: COLORS.textGray,
  },
  recentTicketIssue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 4,
  },
  recentTicketUser: {
    fontSize: 12,
    color: COLORS.textGray,
    marginBottom: 6,
  },
  recentTicketWaste: {
    flexDirection: "row",
    alignItems: "center",
  },
  recentTicketWasteText: {
    fontSize: 11,
    color: COLORS.textGray,
    marginLeft: 4,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 100,
  },
  sectionHeader: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
  },
  ticketItem: {
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
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  ticketMain: {
    flex: 1,
  },
  ticketType: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 4,
  },
  ticketUser: {
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
  ticketInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  wasteTypeText: {
    fontSize: 14,
    color: COLORS.textGray,
    marginLeft: 8,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.textGray,
    marginLeft: 8,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  callButton: {
    backgroundColor: COLORS.primary,
  },
  viewButton: {
    backgroundColor: COLORS.completed,
  },
  assignButton: {
    backgroundColor: COLORS.notificationYellow,
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
