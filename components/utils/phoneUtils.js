import { Linking } from "react-native";

export const makePhoneCall = async (phoneNumber, onSuccess, onError) => {
  if (!phoneNumber) {
    if (onError) onError("Phone number not available");
    return false;
  }

  const phoneUrl = `tel:${phoneNumber}`;

  try {
    const supported = await Linking.canOpenURL(phoneUrl);

    if (supported) {
      await Linking.openURL(phoneUrl);
      if (onSuccess) onSuccess();
      return true;
    } else {
      if (onError) onError("Phone calls not supported on this device");
      return false;
    }
  } catch (error) {
    console.error("Error making phone call:", error);
    if (onError) onError("Failed to make call. Please try again.");
    return false;
  }
};

export const sendTextMessage = async (phoneNumber, onSuccess, onError) => {
  if (!phoneNumber) {
    if (onError) onError("Phone number not available");
    return false;
  }

  const smsUrl = `sms:${phoneNumber}`;

  try {
    const supported = await Linking.canOpenURL(smsUrl);

    if (supported) {
      await Linking.openURL(smsUrl);
      if (onSuccess) onSuccess();
      return true;
    } else {
      if (onError) onError("Cannot send messages from this device");
      return false;
    }
  } catch (error) {
    console.error("Error sending text message:", error);
    if (onError) onError("Failed to send message. Please try again.");
    return false;
  }
};
