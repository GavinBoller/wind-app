"use client";

import React from 'react';
import { signOut } from 'next-auth/react';

export default function PendingApprovalView() {
  return (
    <div className="my-stations-container">
      <div className="header">
        <h1 className="title">Wind sniff</h1>
      </div>
      <div className="card stations-empty">
        <h3 className="onboarding-title">Account Pending Approval</h3>
        <p className="onboarding-text">
          Your account has been created successfully. An administrator will review it shortly.
          You will be able to access the app once your account is approved.
        </p>
        <button className="signin-btn google" onClick={() => signOut()}>Sign Out</button>
      </div>
    </div>
  );
}