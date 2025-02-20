import React, { useState, useEffect } from "react";
import { Animated, StyleSheet } from "react-native";
import CustomText from "../utils/CustomText";
import { COLORS } from "../utils/Constants";

const NotificationBanner = ({ message, type, visible, onHide }) => {
  const translateY = useState(new Animated.Value(-100))[0];

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.notificationBanner,
        {
          transform: [{ translateY }],
          backgroundColor:
            type === "success" ? COLORS.successbanner : COLORS.errorbanner,
        },
      ]}
    >
      <CustomText style={styles.notificationText}>{message}</CustomText>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  notificationBanner: {
    position: "absolute",
    top: 50,
    right: 20,
    left: 20,
    padding: 15,
    borderRadius: 8,
    zIndex: 1000,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notificationText: {
    color: COLORS.white,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
});

export default NotificationBanner;
