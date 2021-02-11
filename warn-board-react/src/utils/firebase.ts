import firebase from "firebase";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  authDomain: "warn-board.firebaseapp.com",
  databaseURL: "https://warn-board.firebaseio.com",
  projectId: "warn-board",
  storageBucket: "warn-board.appspot.com",
  messagingSenderId: "402264274507",
  appId: "1:402264274507:web:52b93cf603c68dcd207fce",
  measurementId: "G-VCDK2M9F9C",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics(); // enable analytics
/**
 * we can add notifications - ex.:
 firebase.analytics().logEvent('notification_received');
 */

export default firebase;
