"use client";

import React from 'react';
import Link from 'next/link';

export default function AccessDeniedView() {
  return (
    <div className="admin-page">
      <div className="card stations-empty">
        <h3 className="onboarding-title">Access Denied</h3>
        <p className="onboarding-text">
          You must be an administrator to view this page.
        </p>
        <div className="confirmation-actions" style={{ justifyContent: 'center', marginTop: '1rem' }}>
            <Link href="/" className="btn btn-secondary">
                Return to App
            </Link>
        </div>
      </div>
    </div>
  );
}