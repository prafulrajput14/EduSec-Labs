import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from "axios";
import App from './App.jsx'
import './App.css'

axios.defaults.baseURL = "https://edusec-labs.onrender.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)