
//export const API_BASE_URL =
  //process.env.API_BASE_URL || "http://localhost:5000";
// optional debug
//console.log("ENV VALUE:", process.env.API_BASE_URL);


//export const API_BASE_URL = "http://192.168.5.195:5000"; //created by Akhila for testing process so ignore. 


import Constants from "expo-constants";

export const API_BASE_URL =
  Constants.expoConfig?.extra?.API_BASE_URL || "http://localhost:5000";

console.log("API URL:", API_BASE_URL);