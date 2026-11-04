import { useState } from "react";

import { useApp } from "@/features/app-state/types";

import { ConsentStep } from "./components/consent-step";
import { GoalStep } from "./components/goal-step";
import { MicCheck } from "./components/mic-check";
import { OnboardingFrame } from "./components/onboarding-frame";

export function OnboardingScreen() {
  const { go } = useApp();
  const [step, setStep] = useState(0);

  return (
    <OnboardingFrame step={step} total={3} onBack={step > 0 ? () => setStep(step - 1) : () => go("auth")}>
      <div key={step} className="animate-rise">
        {step === 0 && <GoalStep onNext={() => setStep(1)} />}
        {step === 1 && <MicCheck onNext={() => setStep(2)} />}
        {step === 2 && (
          <ConsentStep
            onDone={() => {
              go("dashboard");
            }}
          />
        )}
      </div>
    </OnboardingFrame>
  );
}
