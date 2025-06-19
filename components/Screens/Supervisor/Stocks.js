import React, { useState } from "react";
import {
  View,
  SafeAreaView,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { COLORS } from "../../utils/Constants";
import CustomText from "../../utils/CustomText";

const Stocks = () => {
  const [entries, setEntries] = useState([]);
  const [tractorNumber, setTractorNumber] = useState("");
  const [material, setMaterial] = useState("");
  const [quantity, setQuantity] = useState("");
  const [editId, setEditId] = useState(null);

  const handleAddOrUpdateEntry = () => {
    if (tractorNumber && material && quantity) {
      if (editId) {
        // Update existing entry
        const updatedEntries = entries.map((entry) =>
          entry.id === editId
            ? { ...entry, tractorNumber, material, quantity }
            : entry
        );
        setEntries(updatedEntries);
        setEditId(null);
      } else {
        // Add new entry
        const newEntry = {
          id: Date.now().toString(),
          tractorNumber,
          material,
          quantity,
        };
        setEntries((prevEntries) => [...prevEntries, newEntry]);
      }

      // Clear form
      setTractorNumber("");
      setMaterial("");
      setQuantity("");
    }
  };

  const handleDelete = (id) => {
    setEntries((prevEntries) => prevEntries.filter((entry) => entry.id !== id));
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

  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <CustomText style={styles.tableCell}>{item.tractorNumber}</CustomText>
      <CustomText style={styles.tableCell}>{item.material}</CustomText>
      <CustomText style={styles.tableCell}>{item.quantity}</CustomText>

      {/* Edit Button */}
      <TouchableOpacity onPress={() => handleEdit(item)}>
        <CustomText style={styles.editText}>✏️</CustomText>
      </TouchableOpacity>

      {/* Delete Button */}
      <TouchableOpacity onPress={() => handleDelete(item.id)}>
        <CustomText style={styles.deleteText}>🗑️</CustomText>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <CustomText style={styles.heading}>Stocks Page</CustomText>

        {/* Input Form */}
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

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <CustomText style={styles.tableHeaderCell}>Tractor No.</CustomText>
          <CustomText style={styles.tableHeaderCell}>Material</CustomText>
          <CustomText style={styles.tableHeaderCell}>Quantity</CustomText>
          <CustomText style={[styles.tableHeaderCell, { flex: 0.4 }]}>✏️</CustomText>
          <CustomText style={[styles.tableHeaderCell, { flex: 0.4 }]}>🗑️</CustomText>
        </View>

        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <CustomText style={styles.noDataText}>No entries yet</CustomText>
          }
        />
      </ScrollView>
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
    marginBottom: 30,
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
    paddingBottom: 8,
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
    marginTop: 10,
  },
});

export default Stocks;
