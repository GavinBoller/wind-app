"use client";

import React from 'react';
import Link from 'next/link';
import SignOutButton from '../components/SignOutButton';

export default function AdminHeader() {
  return (
    <div className="header">
      <Link href="/" className="title-link">
        <h1 className="title">Wind sniff</h1>
      </Link>
      <div className="admin-header-actions">
        <SignOutButton className="btn btn-sm btn-secondary" />
      </div>
    </div>
  );
}