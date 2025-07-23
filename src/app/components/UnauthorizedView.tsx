"use client";

import React from 'react';
import { signIn } from 'next-auth/react';
import WebViewDetector from './WebViewDetector';

export default function UnauthorizedView() {
  return (
    <div className="my-stations-container">
      <h1 className="title">Wind sniff</h1>
      <p>Please sign in to access your stations.</p>
      <WebViewDetector>
        <div className="signin-buttons">
          <button
            className="signin-btn google"
            onClick={() =>
              // By adding the `prompt: 'select_account'` parameter, we force Google
              // to show the account selection screen every time.
              signIn('google', undefined, { prompt: 'select_account' })}
          >
            Sign in with Google
          </button>
          {/* The Apple button is commented out until you have a developer account */}
          {/* <button className="signin-btn apple" onClick={() => signIn('apple')}>Sign in with Apple</button> */}
        </div>
      </WebViewDetector>
    </div>
  );
}