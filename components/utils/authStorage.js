import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveProviderSession = async (user, profileData) => {
  try {
    if (!user || !profileData) {
      console.error("Invalid data for session saving");
      return null;
    }

    if (
      !profileData.supervisorId ||
      !profileData.municipalCouncil ||
      !profileData.district ||
      !profileData.ward
    ) {
      console.error("Incomplete supervisor profile data for session");
      return null;
    }

    const userData = {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified || true,
      userType: "supervisor",
      profile: profileData,
      lastLogin: new Date().toISOString(),
    };

    await AsyncStorage.setItem("providerSession", JSON.stringify(userData));
    console.log("Supervisor session saved successfully");

    return userData;
  } catch (error) {
    console.error("Error saving provider session:", error);
    return null;
  }
};

export const clearProviderSession = async () => {
  try {
    await AsyncStorage.removeItem("providerSession");
    console.log("Provider session cleared successfully");
    return true;
  } catch (error) {
    console.error("Error clearing provider session:", error);
    return false;
  }
};

export const getProviderSession = async () => {
  try {
    const providerSession = await AsyncStorage.getItem("providerSession");

    if (!providerSession) {
      console.log("No provider session found");
      return null;
    }

    const parsedSession = JSON.parse(providerSession);

    if (!parsedSession.uid || !parsedSession.profile) {
      console.warn("Invalid session format, clearing session");
      await clearProviderSession();
      return null;
    }

    if (parsedSession.userType !== "supervisor") {
      console.warn("Non-supervisor session found, clearing");
      await clearProviderSession();
      return null;
    }

    const { profile } = parsedSession;
    if (
      !profile.supervisorId ||
      !profile.municipalCouncil ||
      !profile.district ||
      !profile.ward
    ) {
      console.warn("Incomplete supervisor profile data in session");
      await clearProviderSession();
      return null;
    }

    return parsedSession;
  } catch (error) {
    console.error("Error getting provider session:", error);
    return null;
  }
};
