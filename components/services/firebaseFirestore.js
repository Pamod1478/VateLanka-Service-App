import { firestore } from "../utils/firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

// Get supervisor details from the database
export const getSupervisorDetails = async (supervisorId) => {
  try {
    const councils = await getDocs(collection(firestore, "municipalCouncils"));

    for (const council of councils.docs) {
      const nicDoc = await getDoc(doc(council.ref, "allNICs", supervisorId));

      if (nicDoc.exists()) {
        const data = nicDoc.data();
        const supervisorRef = doc(
          firestore,
          `municipalCouncils/${data.municipalCouncil}/Districts/${data.district}/Wards/${data.ward}/supervisors/${data.supervisorId}`
        );

        const supervisorDoc = await getDoc(supervisorRef);
        return supervisorDoc.data();
      }
    }
    throw new Error("Supervisor not found");
  } catch (error) {
    console.error("Error fetching supervisor details:", error);
    throw error;
  }
};

// Subscribe to the trucks of a supervisor
export const subscribeToSupervisorTrucks = (
  supervisorId,
  municipalCouncil,
  district,
  ward,
  callback
) => {
  const trucksRef = collection(
    firestore,
    `municipalCouncils/${municipalCouncil}/Districts/${district}/Wards/${ward}/supervisors/${supervisorId}/trucks`
  );

  return onSnapshot(
    trucksRef,
    (snapshot) => {
      const trucks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(trucks);
    },
    (error) => {
      console.error("Error in trucks subscription:", error);
      callback([]);
    }
  );
};
