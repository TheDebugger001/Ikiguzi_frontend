import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import OnboardingModal from "../onboarding/OnboardingModal";

export function needsOnboarding(user) { return ["vendor", "supplier"].includes(user?.role) && user?.isOnboarded === false; }

export default function RestrictedOverview({ children }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  if (!needsOnboarding(user)) return children;
  return <><div className="restricted-warning"><div><strong>Onboarding incomplete</strong><span>Complete your business profile and wait for MVEC verification before publishing products, creating a store, or placing supply orders.</span></div><button className="gradient-btn" onClick={() => setOpen(true)}>Complete Onboarding</button></div>{children}{open && <OnboardingModal onClose={() => setOpen(false)}/>}</>;
}
