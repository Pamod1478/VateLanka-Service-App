import React, { useState } from "react";
import {
  View,
  SafeAreaView,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  SectionList,
} from "react-native";
import { COLORS } from "../../utils/Constants";
import CustomText from "../../utils/CustomText";

const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0]; // YYYY-MM-DD
};

const Stocks = () => {
  const [entries, setEntries] = useState([]);
  const [tractorNumber, setTractorNumber] = useState("");
  const [material, setMaterial] = useState("");
  const [quantity, setQuantity] = useState("");
  const [editId, setEditId] = useState(null);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [materialTotals, setMaterialTotals] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddOrUpdateEntry = () => {
    if (tractorNumber && material && quantity) {
      const numericQuantity = parseFloat(quantity);
      if (isNaN(numericQuantity)) return;

      const date = getCurrentDate();

      if (editId) {
        const oldEntry = entries.find((e) => e.id === editId);
        const oldQuantity = parseFloat(oldEntry.quantity);
        const updatedEntries = entries.map((entry) =>
          entry.id === editId
            ? { ...entry, tractorNumber, material, quantity }
            : entry
        );
        setEntries(updatedEntries);

        setTotalQuantity(totalQuantity - oldQuantity + numericQuantity);

        setMaterialTotals((prev) => {
          const updated = { ...prev };
          updated[oldEntry.material] =
            (updated[oldEntry.material] || 0) - oldQuantity;
          updated[material] = (updated[material] || 0) + numericQuantity;
          return updated;
        });

        setEditId(null);
      } else {
        const newEntry = {
          id: Date.now().toString(),
          tractorNumber,
          material,
          quantity,
          date,
        };
        setEntries((prev) => [...prev, newEntry]);
        setTotalQuantity((prev) => prev + numericQuantity);
        setMaterialTotals((prev) => ({
          ...prev,
          [material]: (prev[material] || 0) + numericQuantity,
        }));
      }

      setSearchQuery(material); // auto filter by added material
      setTractorNumber("");
      setMaterial("");
      setQuantity("");
    }
  };

  const handleDelete = (id) => {
    const deletedEntry = entries.find((entry) => entry.id === id);
    const numericQuantity = parseFloat(deletedEntry.quantity);

    setEntries((prevEntries) => prevEntries.filter((entry) => entry.id !== id));
    setTotalQuantity((prev) => prev - numericQuantity);

    setMaterialTotals((prev) => {
      const updated = { ...prev };
      updated[deletedEntry.material] =
        (updated[deletedEntry.material] || 0) - numericQuantity;
      if (updated[deletedEntry.material] <= 0) {
        delete updated[deletedEntry.material];
      }
      return updated;
    });

    if (editId === id) {
      setEditId(null);
      setTractorNumber("");
      setMaterial("");
      setQuantity("");
    }
  };

  const handleEdit = (entry) => {
    setEditId(entry.id);
    setTractorNumber(entry.tractorNumber);
    setMaterial(entry.material);
    setQuantity(entry.quantity);
  };

  const filteredEntries = entries.filter(
    (entry) =>
      entry.tractorNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.material.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group entries by date for SectionList
  const groupedByDate = filteredEntries.reduce((acc, entry) => {
    const date = entry.date || getCurrentDate();
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  const sections = Object.keys(groupedByDate)
    .sort((a, b) => new Date(b) - new Date(a)) // newest first
    .map((date) => ({
      title: date,
      data: groupedByDate[date],
    }));

  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <CustomText style={styles.tableCell}>{item.tractorNumber}</CustomText>
      <CustomText style={styles.tableCell}>{item.material}</CustomText>
      <CustomText style={styles.tableCell}>{item.quantity}</CustomText>
      <TouchableOpacity onPress={() => handleEdit(item)}>
        <CustomText style={styles.editText}>✏️</CustomText>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDelete(item.id)}>
        <CustomText style={styles.deleteText}>🗑️</CustomText>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <CustomText style={styles.heading}>Stocks Page</CustomText>

        <TextInput
          placeholder="Search by Tractor Number or Material"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.input}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.resetBtn}>
            <CustomText style={{ color: COLORS.primary }}>Show All</CustomText>
          </TouchableOpacity>
        )}

        {/* Form Inputs */}
        <View style={styles.form}>
          <TextInput
            placeholder="Tractor Number"
            value={tractorNumber}
            onChangeText={setTractorNumber}
            style={styles.input}
          />
          <TextInput
            placeholder="Recycling Material"
            value={material}
            onChangeText={setMaterial}
            style={styles.input}
          />
          <TextInput
            placeholder="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            style={styles.input}
          />
          <TouchableOpacity style={styles.button} onPress={handleAddOrUpdateEntry}>
            <CustomText style={styles.buttonText}>
              {editId ? "Update Entry" : "Add Entry"}
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Grouped Table by Date */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.tableHeaderSection}>
            <CustomText style={styles.sectionHeaderText}>Date: {title}</CustomText>
            <View style={styles.tableHeader}>
              <CustomText style={styles.tableHeaderCell}>Tractor No.</CustomText>
              <CustomText style={styles.tableHeaderCell}>Material</CustomText>
              <CustomText style={styles.tableHeaderCell}>Quantity</CustomText>
              <CustomText style={[styles.tableHeaderCell, { flex: 0.4 }]}>✏️</CustomText>
              <CustomText style={[styles.tableHeaderCell, { flex: 0.4 }]}>🗑️</CustomText>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <CustomText style={styles.noDataText}>No entries found</CustomText>
        }
        contentContainerStyle={{ padding: 20 }}
      />

      {/* Totals */}
      <View style={{ padding: 20 }}>
        <CustomText style={{ fontWeight: "bold", fontSize: 16 }}>
          Total Quantity: {totalQuantity}
        </CustomText>
        {Object.entries(materialTotals).map(([mat, qty]) => (
          <CustomText key={mat}>
            {mat}: {qty}
          </CustomText>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "600",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 20,
  },
  form: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: COLORS.gray,
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableHeaderSection: {
    marginTop: 20,
  },
  sectionHeaderText: {
    fontWeight: "bold",
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 5,
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: "700",
    color: COLORS.primary,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderColor: COLORS.lightGray,
    alignItems: "center",
  },
  tableCell: {
    flex: 1,
  },
  deleteText: {
    color: "red",
    fontWeight: "bold",
    paddingHorizontal: 6,
  },
  editText: {
    color: "green",
    fontWeight: "bold",
    paddingHorizontal: 6,
  },
  noDataText: {
    textAlign: "center",
    color: COLORS.gray,
    marginTop: 20,
  },
  resetBtn: {
    alignSelf: "flex-end",
    marginBottom: 10,
  },
});

export default Stocks;
