import { auth, firestore } from "../utils/firebaseConfig";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  saveProviderSession,
  clearProviderSession,
} from "../utils/authStorage";

export const loginSupervisor = async (supervisorId, password) => {
  try {
    if (!supervisorId.startsWith("SUP")) {
      throw new Error("Invalid supervisor ID format");
    }

    const councilsRef = collection(firestore, "municipalCouncils");
    const councils = await getDocs(councilsRef);

    let supervisorDoc = null;
    let supervisorData = null;

    for (const council of councils.docs) {
      const districts = await getDocs(collection(council.ref, "Districts"));

      for (const district of districts.docs) {
        const wards = await getDocs(collection(district.ref, "Wards"));

        for (const ward of wards.docs) {
          const supervisorRef = doc(ward.ref, "supervisors", supervisorId);
          const tempDoc = await getDoc(supervisorRef);

          if (tempDoc.exists()) {
            supervisorDoc = tempDoc;
            supervisorData = tempDoc.data();
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

    await saveProviderSession(
      userCredential.user,
      supervisorData,
      "supervisor"
    );

    return {
      user: userCredential.user,
      profile: supervisorData,
    };
  } catch (error) {
    console.error("Login error:", error);
    if (error.code === "auth/invalid-credential") {
      throw new Error("Invalid password");
    }
    throw new Error(error.message || "Login failed");
  }
};

export const loginDriver = async (truckId, password) => {
  try {
    if (!truckId.startsWith("TRUCK")) {
      throw new Error("Invalid truck ID format");
    }

    const councilsRef = collection(firestore, "municipalCouncils");
    const councils = await getDocs(councilsRef);

    let truckDoc = null;
    let truckData = null;

    for (const council of councils.docs) {
      const districts = await getDocs(collection(council.ref, "Districts"));

      for (const district of districts.docs) {
        const wards = await getDocs(collection(district.ref, "Wards"));

        for (const ward of wards.docs) {
          const supervisors = await getDocs(
            collection(ward.ref, "supervisors")
          );

          for (const supervisor of supervisors.docs) {
            const truckRef = doc(supervisor.ref, "trucks", truckId);
            const tempDoc = await getDoc(truckRef);

            if (tempDoc.exists()) {
              truckDoc = tempDoc;
              truckData = tempDoc.data();
              break;
            }
          }
          if (truckDoc) break;
        }
        if (truckDoc) break;
      }
      if (truckDoc) break;
    }

    if (!truckDoc) {
      throw new Error("Truck not found");
    }

    const userCredential = await signInWithEmailAndPassword(
      auth,
      truckData.email,
      password
    );

    await saveProviderSession(userCredential.user, truckData, "driver");

    return {
      user: userCredential.user,
      profile: truckData,
    };
  } catch (error) {
    console.error("Login error:", error);
    if (error.code === "auth/invalid-credential") {
      throw new Error("Invalid password");
    }
    throw new Error(error.message || "Login failed");
  }
};

export const logout = async () => {
  try {
    await clearProviderSession();
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw new Error("Failed to logout");
  }
};
