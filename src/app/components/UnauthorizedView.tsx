"use client";

import React from 'react';
import SignInButton from './SignInButton';

export default function UnauthorizedView() {
  return (
    <div className="my-stations-container">
      <h1 className="title">Wind App</h1>
      <p>Please sign in to access your stations.</p>
      <SignInButton />
    </div>
  );
}