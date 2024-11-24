import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import React from "react";
import ReactDOM from "react-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";

const clientId = "307813090600-kldsd3d345j4vgm07t1tsruoujfeqa6u.apps.googleusercontent.com";

ReactDOM.render(
  <GoogleOAuthProvider clientId={clientId}>
    <App />
  </GoogleOAuthProvider>,
  document.getElementById("root")
);