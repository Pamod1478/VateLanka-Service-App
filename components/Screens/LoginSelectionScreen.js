import React from "react";
import {
  SafeAreaView,
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import CustomText from "../utils/CustomText";
import { COLORS } from "../utils/Constants";
import Feather from "react-native-vector-icons/Feather";

export default function LoginSelectionScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <CustomText style={styles.headerText}>Select Your Role</CustomText>
        <CustomText style={styles.subtitle}>
          Choose your service role to continue
        </CustomText>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => navigation.navigate("DriverLogin")}
          activeOpacity={0.9}
        >
          <View style={styles.iconContainer}>
            <Feather name="truck" size={32} color={COLORS.primary} />
          </View>
          <View style={styles.textContainer}>
            <CustomText style={styles.roleText}>Truck Driver</CustomText>
            <CustomText style={styles.roleDescription}>
              Login as waste collection vehicle driver
            </CustomText>
          </View>
          <Feather name="chevron-right" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => navigation.navigate("SupervisorLogin")}
          activeOpacity={0.9}
        >
          <View style={styles.iconContainer}>
            <Feather name="user" size={32} color={COLORS.primary} />
          </View>
          <View style={styles.textContainer}>
            <CustomText style={styles.roleText}>
              Municipal Supervisor
            </CustomText>
            <CustomText style={styles.roleDescription}>
              Login as municipal council supervisor
            </CustomText>
          </View>
          <Feather name="chevron-right" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <Image
        source={require("../ApplicationAssets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textGray,
  },
  buttonContainer: {
    gap: 20,
    marginLeft: 5,
    marginRight: 5,
  },
  roleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.secondary,
    padding: 19,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },
  iconContainer: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.white,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  roleText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: COLORS.textGray,
  },
  logo: {
    width: "100%",
    height: 100,
    alignSelf: "center",
    marginTop: "auto",
    marginBottom: 20,
  },
});
