import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

const LOCATION_TRACKING_TASK_NAME = 'BACKGROUND_DELIVERY_TRACKING';

// Define the background task
TaskManager.defineTask(LOCATION_TRACKING_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Location tracking error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const latestLocation = locations[0];
    
    if (latestLocation) {
      console.log('Got background location:', latestLocation.coords);
      
      // TODO: Make an API call to your backend to update the delivery rider's location
      // Example:
      // await fetch('YOUR_API_URL/api/v1/delivery/update-location', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     riderId: 'rider-123',
      //     orderId: 'order-456',
      //     latitude: latestLocation.coords.latitude,
      //     longitude: latestLocation.coords.longitude,
      //     timestamp: latestLocation.timestamp
      //   })
      // });
    }
  }
});

// Helper to start tracking
export const startDeliveryTracking = async () => {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus === 'granted') {
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    
    if (backgroundStatus === 'granted') {
      await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000, // Update every 10 seconds
        distanceInterval: 10, // Or every 10 meters
        deferredUpdatesInterval: 1000,
        showsBackgroundLocationIndicator: true, // Required for iOS
        foregroundService: {
          notificationTitle: "Kwick Delivery",
          notificationBody: "Tracking your active delivery",
          notificationColor: "#10b981", // Brand Green
        }
      });
      console.log('Background tracking started');
    }
  }
};

// Helper to stop tracking
export const stopDeliveryTracking = async () => {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING_TASK_NAME);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK_NAME);
    console.log('Background tracking stopped');
  }
};
