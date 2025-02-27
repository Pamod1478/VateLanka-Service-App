import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveProviderSession = async (user, profileData, userType) => {
  try {
    if (!user || !profileData || !userType) {
      console.error("Invalid data for session saving");
      return;
    }

    if (userType === "supervisor") {
      if (
        !profileData.supervisorId ||
        !profileData.municipalCouncil ||
        !profileData.district ||
        !profileData.ward
      ) {
        console.error("Incomplete supervisor profile data for session");
        return;
      }
    } else if (userType === "driver") {
      if (
        !profileData.truckId ||
        !profileData.municipalCouncil ||
        !profileData.district ||
        !profileData.ward ||
        !profileData.supervisorId
      ) {
        console.error("Incomplete driver profile data for session");
        return;
      }
    }

    const userData = {
      uid: user.uid,
      email: user.email,
      userType,
      profile: profileData,
      timestamp: Date.now(),
    };

    await AsyncStorage.setItem("providerSession", JSON.stringify(userData));
    console.log(`${userType} session saved successfully`);

    console.log("Session data saved:", JSON.stringify(userData));
  } catch (error) {
    console.error("Error saving provider session:", error);
  }
};

export const clearProviderSession = async () => {
  try {
    await AsyncStorage.removeItem("providerSession");
    console.log("Provider session cleared successfully");
  } catch (error) {
    console.error("Error clearing provider session:", error);
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

    if (
      !parsedSession.uid ||
      !parsedSession.userType ||
      !parsedSession.profile
    ) {
      console.warn("Invalid session format, clearing session");
      await clearProviderSession();
      return null;
    }

    if (parsedSession.userType === "supervisor") {
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
    } else if (parsedSession.userType === "driver") {
      const { profile } = parsedSession;
      if (
        !profile.truckId ||
        !profile.municipalCouncil ||
        !profile.district ||
        !profile.ward ||
        !profile.supervisorId
      ) {
        console.warn("Incomplete driver profile data in session");
        await clearProviderSession();
        return null;
      }
    }

    console.log(`Retrieved valid ${parsedSession.userType} session`);
    console.log("Profile data:", JSON.stringify(parsedSession.profile));

    return parsedSession;
  } catch (error) {
    console.error("Error getting provider session:", error);
    return null;
  }
};
