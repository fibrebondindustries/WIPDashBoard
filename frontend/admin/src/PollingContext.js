import React, { createContext, useEffect, useState, useCallback } from "react";
import axiosInstance from "./axiosConfig";

export const PollingContext = createContext();

export const PollingProvider = ({ children }) => {
  const [activityDetected, setActivityDetected] = useState(false);

  const updateResources = useCallback(async () => {
    try {
      await axiosInstance.post("/api/departments/update-resources");
      console.log("Resources updated successfully!");
    } catch (error) {
      console.error("Error updating resources globally:", error);
    }
  }, []);

  const pollUserActivity = useCallback(() => {
    const intervalId = setInterval(async () => {
      try {
        const response = await axiosInstance.get("/api/user-activity/recent");
        const isActivityDetected = response.data.activityDetected;

        if (isActivityDetected && !activityDetected) {
          console.log("Activity detected globally!");
          setActivityDetected(true);
          updateResources(); // Trigger updateResources globally
        } else if (!isActivityDetected && activityDetected) {
          setActivityDetected(false);
        }
      } catch (error) {
        console.error("Error polling for user activity:", error);
      }
    }, 5000); // Poll every 500 milliseconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [activityDetected, updateResources]);

  useEffect(() => {
    const stopPolling = pollUserActivity();
    return stopPolling; // Cleanup polling on provider unmount
  }, [pollUserActivity]);

  return (
    <PollingContext.Provider value={{ activityDetected }}>
      {children}
    </PollingContext.Provider>
  );
};
