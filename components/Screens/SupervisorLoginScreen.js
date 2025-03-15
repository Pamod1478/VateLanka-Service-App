import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  BackHandler,
} from "react-native";
import { COLORS } from "../utils/Constants";
import CustomText from "../utils/CustomText";
import { loginSupervisor } from "../services/firebaseAuth";
import NotificationBanner from "../utils/NotificationBanner";

export default function SupervisorLoginScreen({ navigation }) {
  const [supervisorId, setSupervisorId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (loading) {
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [loading]);

  const showNotification = (message, type) => {
    setNotification({
      visible: true,
      message,
      type,
    });
  };

  const handleLogin = async () => {
    Keyboard.dismiss();

    if (!supervisorId) {
      showNotification("Please enter your Supervisor ID", "error");
      return;
    }

    if (!password) {
      showNotification("Please enter your password", "error");
      return;
    }

    const formattedSupervisorId = supervisorId.trim().toUpperCase();
    if (!formattedSupervisorId.startsWith("SUP")) {
      showNotification(
        "Invalid Supervisor ID format. ID should start with 'SUP'",
        "error"
      );
      return;
    }

    try {
      setLoading(true);

      const result = await loginSupervisor(formattedSupervisorId, password);

      showNotification("Login successful!", "success");

      setTimeout(() => {
        setLoading(false);
        navigation.reset({
          index: 0,
          routes: [{ name: "MainApp" }],
        });
      }, 1500);
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);

      showNotification(
        error.message || "Login failed. Please try again.",
        "error"
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <NotificationBanner
          {...notification}
          onHide={() =>
            setNotification((prev) => ({ ...prev, visible: false }))
          }
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
            autoCapitalize="characters"
            onChangeText={setSupervisorId}
            value={supervisorId}
            editable={!loading}
          />
          <TextInput
            placeholder="Password"
            style={styles.input}
            placeholderTextColor={COLORS.placeholderTextColor}
            secureTextEntry
            onChangeText={setPassword}
            value={password}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            activeOpacity={0.9}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <CustomText style={styles.buttonText}>Login</CustomText>
            )}
          </TouchableOpacity>

          <View style={styles.helpTextContainer}>
            <CustomText style={styles.helpText}>
              If you're having trouble logging in, please contact support.
            </CustomText>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
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
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  helpTextContainer: {
    alignItems: "center",
  },
  helpText: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: "center",
  },
});
