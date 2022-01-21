// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyALXo-5WOCB_VmvtIFkQ30n5yHgCYJB1_Y",
    authDomain: "oddie-1d219.firebaseapp.com",
    projectId: "oddie-1d219",
    storageBucket: "oddie-1d219.appspot.com",
    messagingSenderId: "1087791914863",
    appId: "1:1087791914863:web:8fa6ddce0acf4280f3d29a",
    measurementId: "G-MQV0WYF6RG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

//BCXrAnOkVuPOB3NDswKpNsIJYyIgFYGMp9jIHf9lYu0yx5gJlR6Fj5NBj7HHlbfSZzLvPOZ64Lebf6_5qF-tIog



const messaging = getMessaging();

get