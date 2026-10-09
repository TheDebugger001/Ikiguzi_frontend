import React, { useState, useEffect } from "react";

export default function GoogleButton({ onGoogleLogin }) {
  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Initialize the Google Identity Services client
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_init: true,
      });

      // Render the Google Sign-In button
      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-button"),
        { theme: "outline", size: "large" }
      );
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [onGoogleLogin]);

  const handleCredentialResponse = async (response) => {
    if (!onGoogleLogin) return;
    try {
      const res = await onGoogleLogin(response);
      if (res.user) {
        // Navigate based on user role
        const roleMap = {
          super_admin: "/admin",
          vendor: "/vendor",
          supplier: "/supplier",
          affiliate: "/affiliate",
          delivery: "/delivery",
          buyer: "/",
        };
        const role = res.user.role || "buyer";
        window.location.href = roleMap[role] || "/";
      }
    } catch (error) {
      console.error("Google login failed:", error);
    }
  };

  return (
    <div
      id="google-signin-button"
      style={{
        width: "100%",
        maxWidth: 300,
        margin: "auto",
      }}
    />
  );
}
