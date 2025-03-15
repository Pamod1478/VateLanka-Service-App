import React from "react";
import { Text, StyleSheet } from "react-native";
import { COLORS } from "./Constants";

const CustomText = ({ children, style, ...props }) => {
  return (
    <Text style={[styles.defaultText, style]} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  defaultText: {
    fontFamily: "Poppins_400Regular",
    color: COLORS.black,
  },
});

export default CustomText;
