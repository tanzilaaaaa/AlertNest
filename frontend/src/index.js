import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider clientId="1088218926065-qsifc0hotihjjq7mg9btffnjj1oromjt.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);
