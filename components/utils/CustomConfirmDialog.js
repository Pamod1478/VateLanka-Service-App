import React from "react";
import { View, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { COLORS } from "./Constants";
import CustomText from "./CustomText";
import Icon from "react-native-vector-icons/Feather";

export default function CustomConfirmDialog({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  iconName = "alert-triangle",
  iconColor = COLORS.notificationYellow,
  confirmButtonColor = COLORS.errorbanner,
  confirmTextColor = COLORS.white,
}) {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <View style={styles.card}>
          <Icon
            name={iconName}
            size={50}
            color={iconColor}
            style={styles.icon}
          />
          <CustomText style={styles.title}>{title}</CustomText>
          <CustomText style={styles.message}>{message}</CustomText>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <CustomText style={styles.cancelButtonText}>
                {cancelText || "Cancel"}
              </CustomText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: confirmButtonColor },
              ]}
              onPress={onConfirm}
            >
              <CustomText
                style={[styles.confirmButtonText, { color: confirmTextColor }]}
              >
                {confirmText || "Confirm"}
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },
  confirmButton: {
    backgroundColor: COLORS.errorbanner,
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
