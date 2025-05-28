import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Initialize SendGrid
const SENDGRID_ENDPOINT = 'https://api.sendgrid.com/v3/mail/send';
const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY;

// Initialize Twilio
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER;

// Get user preferences
export const getUserPreferences = async (userId) => {
  try {
    const userPrefsDoc = await getDoc(doc(db, 'userPreferences', userId));
    if (userPrefsDoc.exists()) {
      return userPrefsDoc.data().notifications || { inApp: true, email: true, sms: false };
    }
    return { inApp: true, email: true, sms: false };
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return { inApp: true, email: true, sms: false };
  }
};

// Send email notification
export const sendEmailNotification = async (to, subject, content) => {
  try {
    const response = await fetch(SENDGRID_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: 'notifications@safeapp.com', name: 'SAFE App' },
        subject: subject,
        content: [{ type: 'text/html', value: content }]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Send SMS notification
export const sendSMSNotification = async (to, message) => {
  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: TWILIO_PHONE_NUMBER,
        Body: message,
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send SMS');
    }

    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
};

// Send notification through all enabled channels
export const sendNotification = async (userId, notification) => {
  try {
    const userPrefs = await getUserPreferences(userId);
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    if (!userData) {
      throw new Error('User data not found');
    }

    // Always send in-app notification
    // This is handled by the existing notifications.js file

    // Send email if enabled
    if (userPrefs.email && userData.email) {
      await sendEmailNotification(
        userData.email,
        notification.title,
        `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0d522c;">${notification.title}</h2>
            <p style="color: #333;">${notification.message}</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">
              This is an automated message from SAFE App. Please do not reply to this email.
            </p>
          </div>
        `
      );
    }

    // Send SMS if enabled
    if (userPrefs.sms && userData.phone) {
      await sendSMSNotification(
        userData.phone,
        `${notification.title}\n\n${notification.message}`
      );
    }

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}; 