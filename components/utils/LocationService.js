import * as Location from "expo-location";
import { firestore } from "./firebaseConfig";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

class LocationService {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.currentTruckId = null;
    this.currentMunicipalCouncil = null;
    this.currentDistrict = null;
    this.currentWard = null;
    this.currentSupervisorId = null;
    this.routeStatus = "idle";
  }

  async requestPermissions() {
    const { status: foregroundStatus } =
      await Location.requestForegroundPermissionsAsync();

    if (foregroundStatus !== "granted") {
      throw new Error("Permission to access location was denied");
    }

    const { status: backgroundStatus } =
      await Location.requestBackgroundPermissionsAsync();
    return { foregroundStatus, backgroundStatus };
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

  async startRoute() {
    try {
      await this.requestPermissions();

      const truckRef = this.getTruckDocRef();
      await updateDoc(truckRef, {
        routeStatus: "active",
        lastLocationUpdate: serverTimestamp(),
      });

      this.routeStatus = "active";

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
          timeInterval: 2000,
        },
        this.updateLocation.bind(this)
      );

      this.isTracking = true;
      return true;
    } catch (error) {
      console.error("Error starting route tracking:", error);
      throw error;
    }
  }

  async updateLocation(location) {
    try {
      if (!this.isTracking) return;

      console.log("Raw location data:", JSON.stringify(location));

      const { latitude, longitude, heading, speed, timestamp } =
        location.coords;

      let formattedTimestamp;
      try {
        formattedTimestamp = new Date(timestamp).toISOString();
      } catch (error) {
        console.warn("Invalid timestamp format, using current time instead");
        formattedTimestamp = new Date().toISOString();
      }

      const truckRef = this.getTruckDocRef();
      await updateDoc(truckRef, {
        currentLocation: {
          latitude,
          longitude,
          heading: heading || 0,
          speed: speed || 0,
          timestamp: formattedTimestamp,
        },
        lastLocationUpdate: serverTimestamp(),
      });

      console.log("Location updated:", latitude, longitude);
    } catch (error) {
      console.error("Error updating location:", error);
    }
  }

  async pauseRoute() {
    try {
      const truckRef = this.getTruckDocRef();
      await updateDoc(truckRef, {
        routeStatus: "paused",
        lastLocationUpdate: serverTimestamp(),
      });

      this.routeStatus = "paused";
      return true;
    } catch (error) {
      console.error("Error pausing route:", error);
      throw error;
    }
  }

  async resumeRoute() {
    try {
      const truckRef = this.getTruckDocRef();
      await updateDoc(truckRef, {
        routeStatus: "active",
        lastLocationUpdate: serverTimestamp(),
      });

      this.routeStatus = "active";
      return true;
    } catch (error) {
      console.error("Error resuming route:", error);
      throw error;
    }
  }

  async stopRoute() {
    try {
      if (this.watchId) {
        this.watchId.remove();
        this.watchId = null;
      }

      this.isTracking = false;

      const truckRef = this.getTruckDocRef();
      await updateDoc(truckRef, {
        routeStatus: "completed",
        lastLocationUpdate: serverTimestamp(),
      });

      this.routeStatus = "idle";
      return true;
    } catch (error) {
      console.error("Error stopping route:", error);
      throw error;
    }
  }

  getStatus() {
    return {
      isTracking: this.isTracking,
      routeStatus: this.routeStatus,
    };
  }
}

const locationService = new LocationService();

export default locationService;
