import { firestore } from "./firebaseConfig";
import { doc } from "firebase/firestore";

class LocationService {
  constructor() {
    this.currentTruckId = null;
    this.currentMunicipalCouncil = null;
    this.currentDistrict = null;
    this.currentWard = null;
    this.currentSupervisorId = null;
  }

  setTruckInfo(truckId, municipalCouncil, district, ward, supervisorId) {
    this.currentTruckId = truckId;
    this.currentMunicipalCouncil = municipalCouncil;
    this.currentDistrict = district;
    this.currentWard = ward;
    this.currentSupervisorId = supervisorId;
  }

  getTruckDocRef() {
    if (
      !this.currentTruckId ||
      !this.currentMunicipalCouncil ||
      !this.currentDistrict ||
      !this.currentWard ||
      !this.currentSupervisorId
    ) {
      throw new Error("Truck information not set");
    }

    return doc(
      firestore,
      `municipalCouncils/${this.currentMunicipalCouncil}/Districts/${this.currentDistrict}/Wards/${this.currentWard}/supervisors/${this.currentSupervisorId}/trucks/${this.currentTruckId}`
    );
  }

  getRoutePath(municipalCouncil, district, ward, supervisorId, truckId) {
    return `municipalCouncils/${municipalCouncil}/Districts/${district}/Wards/${ward}/supervisors/${supervisorId}/trucks/${truckId}`;
  }
}

const locationService = new LocationService();

export default locationService;
