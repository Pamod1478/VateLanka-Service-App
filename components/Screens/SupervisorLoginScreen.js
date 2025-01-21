import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from "react-native";
import { COLORS } from "../utils/Constants";
import CustomText from "../utils/CustomText";

const NotificationBanner = ({ message, type, visible, onHide }) => {
    const translateY = useState(new Animated.Value(-100))[0];
  
    React.useEffect(() => {
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
  
    const backgroundColor =
      type === "success" ? COLORS.successbanner : COLORS.errorbanner;
  
    if (!visible) return null;
  
    return (
      <Animated.View
        style={[
          styles.notificationBanner,
          { transform: [{ translateY }], backgroundColor },
        ]}
      >
        <CustomText style={styles.notificationText}>{message}</CustomText>
      </Animated.View>
    );
  };

export default function SupervisorLoginScreen({ navigation }) {
  const [supervisorId, setSupervisorId] = useState("");
  const [password, setPassword] = useState("");
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const showNotification = (message, type) => {
    setNotification({
      visible: true,
      message,
      type,
    });
  };

  const handleLogin = async () => {
    if (!supervisorId || !password) {
      showNotification("Please enter both Supervisor ID and password.", "error");
      return;
    }
    try {
      showNotification("Login successful!", "success");
    } catch (error) {
      showNotification("Invalid credentials", "error");
    }
  };

  return (
    <View style={styles.container}>
      <NotificationBanner
        {...notification}
        onHide={() => setNotification((prev) => ({ ...prev, visible: false }))}
      />
      <Image
        source={require("../ApplicationAssets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.card}>
        <CustomText style={styles.title}>Supervisor Login</CustomText>
        <TextInput
          placeholder="Supervisor ID"
          style={styles.input}
          placeholderTextColor={COLORS.placeholderTextColor}
          autoCapitalize="none"
          onChangeText={setSupervisorId}
          value={supervisorId}
        />
        <TextInput
          placeholder="Password"
          style={styles.input}
          placeholderTextColor={COLORS.placeholderTextColor}
          secureTextEntry
          onChangeText={setPassword}
          value={password}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          activeOpacity={0.9}
        >
          <CustomText style={styles.buttonText}>Login</CustomText>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          activeOpacity={0.9}
          style={styles.backButton}
        >
          <CustomText style={styles.backButtonText}>
            Back to Selection
          </CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20,
  },
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
  logo: {
    width: 150,
    height: 60,
    alignSelf: "center",
    marginTop: 70,
    marginBottom: 100,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    backgroundColor: COLORS.white,
    color: COLORS.black,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    alignItems: "center",
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 14,
  }
});