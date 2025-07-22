"use client";

import React, { useState, useEffect } from 'react';

interface WebViewDetectorProps {
  children: React.ReactNode;
}

export default function WebViewDetector({ children }: WebViewDetectorProps) {
  const [isWebView, setIsWebView] = useState(false);

  useEffect(() => {
    // This check runs only on the client side
    const navigator = window.navigator;
    const userAgent = navigator.userAgent.toLowerCase();

    // Common patterns for in-app browsers on iOS
    const isFacebook = /fban|fbav/i.test(userAgent);
    const isInstagram = /instagram/i.test(userAgent);
    const isGmail = / \bgmail\b/i.test(userAgent);
    // A general check for iOS WebViews that are not Safari
    const isIOSWebView = /(iphone|ipod|ipad).*applewebkit(?!.*safari)/i.test(userAgent);

    if (isFacebook || isInstagram || isGmail || isIOSWebView) {
      setIsWebView(true);
    }
  }, []);

  if (isWebView) {
    const handleCopyLink = () => {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard! Please paste it into your main browser (like Safari or Chrome).');
    };

    return (
      <div className="webview-warning">
        <p>For the best experience and secure sign-in, please open this page in your main browser.</p>
        <div className="webview-warning-actions">
          <button className="signin-btn" onClick={handleCopyLink}>Copy Link</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}