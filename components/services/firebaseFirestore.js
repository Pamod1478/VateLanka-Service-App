import { firestore } from "../utils/firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

// Supervisor related functions
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

// Truck related functions
export const getDriverDetails = async (truckId) => {
  try {
    const councils = await getDocs(collection(firestore, "municipalCouncils"));

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
            const truckDoc = await getDoc(truckRef);

            if (truckDoc.exists()) {
              return {
                ...truckDoc.data(),
                supervisorRef: supervisor.ref,
              };
            }
          }
        }
      }
    }
    throw new Error("Driver not found");
  } catch (error) {
    console.error("Error fetching driver details:", error);
    throw error;
  }
};

export const subscribeToDriverUpdates = (
  truckId,
  municipalCouncil,
  district,
  ward,
  supervisorId,
  callback
) => {
  const truckRef = doc(
    firestore,
    `municipalCouncils/${municipalCouncil}/Districts/${district}/Wards/${ward}/supervisors/${supervisorId}/trucks/${truckId}`
  );

  return onSnapshot(
    truckRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      }
    },
    (error) => {
      console.error("Error in driver subscription:", error);
      callback(null);
    }
  );
};
