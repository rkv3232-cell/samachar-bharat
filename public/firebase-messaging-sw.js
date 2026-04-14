// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// You can get this from your Firebase project settings.
firebase.initializeApp({
    apiKey: "AIzaSyDifBJQjsNupXCDewPTX44LCwf-nQ2o4IU",
    authDomain: "samachar-bharat.firebaseapp.com",
    projectId: "samachar-bharat",
    storageBucket: "samachar-bharat.firebasestorage.app",
    messagingSenderId: "614483286575",
    appId: "1:614483286575:web:0d6211a851ca47c36d04da"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png', // Update with your logo path
        data: {
            url: payload.data.url || '/'
        }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
