import firebase from 'firebase';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBgTAs4Wsv0hZ6RwyiwRx8qyk3FEv2FczY',
  authDomain: 'joker-90f14.firebaseapp.com',
  projectId: 'joker-90f14',
  storageBucket: 'joker-90f14.appspot.com',
  messagingSenderId: '601691639895',
  appId: '1:601691639895:web:15c80834314fdc2bf51312',
};

// Initialize Firebase
let fbApp;

if (!firebase.apps.length) {
  console.log('build a new FB APP');
  fbApp = firebase.initializeApp(firebaseConfig);
} else {
  console.log('we alreadyhave FB APP');
  fbApp = firebase.app(); // if already initialized, use that one
}

let storage = firebase.storage();

let db = fbApp.firestore();
let fs = firebase.firestore;

export { fs };
export { db };
export { storage }
