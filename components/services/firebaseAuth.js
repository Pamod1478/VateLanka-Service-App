import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import {
  saveProviderSession,
  clearProviderSession,
  getProviderSession,
} from "../utils/authStorage";
import { auth, firestore, ensureInitialized } from "../utils/firebaseConfig";

// Login function for supervisors
export const loginSupervisor = async (supervisorId, password) => {
  await ensureInitialized();
  try {
    if (!supervisorId.startsWith("SUP")) {
      throw new Error("Invalid supervisor ID format");
    }

    console.log("Searching for supervisor:", supervisorId);
    const councilsRef = collection(firestore, "municipalCouncils");
    const councils = await getDocs(councilsRef);

    let supervisorDoc = null;
    let supervisorData = null;
    let councilId = "";
    let districtId = "";
    let wardId = "";

    for (const council of councils.docs) {
      councilId = council.id;
      const districts = await getDocs(collection(council.ref, "Districts"));

      for (const district of districts.docs) {
        districtId = district.id;
        const wards = await getDocs(collection(district.ref, "Wards"));

        for (const ward of wards.docs) {
          wardId = ward.id;
          const supervisorRef = doc(ward.ref, "supervisors", supervisorId);
          const tempDoc = await getDoc(supervisorRef);

          if (tempDoc.exists()) {
            supervisorDoc = tempDoc;
            supervisorData = {
              ...tempDoc.data(),
              supervisorId,
              municipalCouncil: councilId,
              district: districtId,
              ward: wardId,
            };
            break;
          }
        }
        if (supervisorDoc) break;
      }
      if (supervisorDoc) break;
    }

    if (!supervisorDoc) {
      throw new Error("Supervisor not found");
    }

    const userCredential = await signInWithEmailAndPassword(
      auth,
      supervisorData.email,
      password
    );

    await saveProviderSession(userCredential.user, supervisorData);

    let verifiedSession = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (!verifiedSession && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      attempts++;
      console.log(`Verifying session (attempt ${attempts}/${maxAttempts})...`);
      verifiedSession = await getProviderSession();

      if (
        verifiedSession &&
        verifiedSession.profile &&
        verifiedSession.profile.supervisorId
      ) {
        console.log("Session verification successful!");
      }
    }

    if (!verifiedSession) {
      console.warn("Could not verify session after multiple attempts");
    }

    return {
      user: userCredential.user,
      profile: supervisorData,
    };
  } catch (error) {
    console.error("Login error:", error);

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/invalid-email" ||
      error.code === "auth/wrong-password"
    ) {
      throw new Error("Invalid supervisor ID or password");
    } else if (error.code === "auth/user-disabled") {
      throw new Error("This account has been disabled");
    } else if (error.code === "auth/network-request-failed") {
      throw new Error("Network error. Please check your connection");
    }

    throw new Error(error.message || "Login failed");
  }
};

// Logout function for supervisors
export const logout = async () => {
  try {
    await clearProviderSession();
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    throw new Error("Failed to logout");
  }
};
