import React from "react";
import { View, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { COLORS } from "../../utils/Constants";
import CustomText from "../../utils/CustomText";
import Icon from "react-native-vector-icons/Feather";

export default function ConfirmStopScreen({ route, navigation }) {
  const { onConfirm } = route.params;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Icon
          name="alert-triangle"
          size={50}
          color="#FF9800"
          style={styles.icon}
        />
        <CustomText style={styles.title}>End Route?</CustomText>
        <CustomText style={styles.message}>
          Are you sure you want to end the route for today? This action cannot
          be undone.
        </CustomText>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
          >
            <CustomText style={styles.cancelButtonText}>Cancel</CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.confirmButton]}
            onPress={handleConfirm}
          >
            <CustomText style={styles.confirmButtonText}>End Route</CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  card: {
    width: "85%",
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: COLORS.textGray,
    textAlign: "center",
    marginBottom: 25,
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    gap: 15,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },
  confirmButton: {
    backgroundColor: "#F44336",
  },
  cancelButtonText: {
    color: COLORS.textGray,
    fontWeight: "600",
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: "600",
  },
});
