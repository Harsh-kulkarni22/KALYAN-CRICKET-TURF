"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, KeyRound, Mail, Smartphone, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

const GoogleLoginButton = ({ onSuccess }: any) => {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => onSuccess(tokenResponse.access_token),
    onError: () => toast.error("Google Login failed")
  });

  return (
    <button onClick={() => login()} className="flex flex-col items-center gap-2 group text-center">
      <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 group-hover:bg-gray-50">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      </div>
      <span className="text-sm font-medium text-gray-600">Google</span>
    </button>
  );
};

export default function Auth() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState(1); // 1: contact, 2: otp, 3: profile setup
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  // TEMPORARILY DISABLED
  // Phone OTP login is currently hidden.
  // Code preserved for future use.
  // const [isEmail, setIsEmail] = useState(false);
  const [isEmail, setIsEmail] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);

  // TEMPORARILY DISABLED
  // Will be re-enabled later
  /*
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Clear existing instances to prevent Hot Reload / React Strict Mode detachment errors
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = undefined;
      }
      
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
    }

    return () => {
      // Cleanup on unmount securely
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);
  */

  const handleSendOtp = async () => {
    if (!contact) return toast.error(isEmail ? "Please enter email" : "Please enter mobile number");

    if (isEmail) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contact })
        });
        const data = await res.json();
        if (res.ok) {
          toast.success("OTP sent to your email", { duration: 4000 });
          setStep(2);
        } else {
          toast.error(data.error || "Failed to send OTP");
        }
      } catch (err) {
        toast.error("Failed to sequence OTP backend.");
      }
    } else {
      // TEMPORARILY DISABLED
      // Will be re-enabled later
      /*
      try {
        let appVerifier = window.recaptchaVerifier;
        if (!appVerifier) {
            appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
            window.recaptchaVerifier = appVerifier;
        }
        const formattedPhone = "+91" + contact;
        const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        window.confirmationResult = confirmationResult;
        
        toast.success("OTP sent to your mobile");
        setStep(2);
      } catch (error: any) {
        console.error(error);
        toast.error(error.message || "Failed to send OTP");
      }
      */
    }
  };

  const handleVerifyOtp = async () => {
    if (step === 2) {
      if (!otp) return toast.error("Please enter OTP");

      if (isEmail) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contact, otp })
          });
          const data = await res.json();
          if (data.needsProfile) {
            setStep(3);
          } else if (res.ok) {
            login(data.token, data.user);
            toast.success("Login Successful");
            router.push("/book");
          } else {
            toast.error(data.error || "Invalid OTP");
          }
        } catch (e) {
          toast.error("Network sync crash natively.");
        }
      } else {
        // TEMPORARILY DISABLED
        // Will be re-enabled later
        /*
        try {
          const result = await window.confirmationResult.confirm(otp);
          setFirebaseUser(result.user);
          
          // Sync Firebase logic safely acquiring real JWT bindings internally!
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/firebase-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: contact })
          });
          const data = await res.json();
          
          if (data.needsProfile) {
            setStep(3); // Route to generic Profile mapper 
          } else if (res.ok) {
            login(data.token, data.user);
            toast.success("Login Successful");
            router.push("/book");
          } else {
            toast.error(data.error || "Firebase Sync Failed");
          }
        } catch (error: any) {
          console.error(error);
          toast.error("Invalid OTP");
        }
        */
      }
    } else if (step === 3) {
      if (!name) return toast.error("Please enter your name");

      if (isEmail) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contact, otp, name })
          });
          const data = await res.json();
          if (res.ok) {
            login(data.token, data.user);
            toast.success("Login Successful");
            router.push("/book");
          } else {
            toast.error(data.error || "Setup Failed");
          }
        } catch {
          toast.error("Network sync crash natively.");
        }
      } else {
        // TEMPORARILY DISABLED
        // Will be re-enabled later
        /*
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/firebase-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: contact, name })
          });
          const data = await res.json();
          if (res.ok) {
            login(data.token, data.user);
            toast.success("Login Successful");
            router.push("/book");
          } else {
            toast.error(data.error || "Firebase Sync Failed");
          }
        } catch (error) {
          toast.error("Network sync crash natively.");
        }
        */
      }
    }
  };

  const handleGoogleAuth = async (accessToken: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/google-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    });
    const data = await res.json();
    if (res.ok) {
      login(data.token, data.user);
      toast.success("Google Login Successful");
      router.push("/book");
    } else {
      toast.error(data.error || "Google login failed on server");
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "486675869845-cscti8jc9nn1m7nqjurhb8i6fkutk9ss.apps.googleusercontent.com"}>
      <div className="flex flex-col min-h-screen bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <Link href="/book" className="p-2"><ChevronLeft size={24} className="text-gray-700" /></Link>
          <span className="font-semibold text-lg text-[#2A364E]">Login / Sign Up</span>
          <div className="w-8"></div>
        </div>

        {/* TEMPORARILY DISABLED */}
        {/* Phone OTP login is currently hidden. */}
        {/* Code preserved for future use. */}
        {/* <div id="recaptcha-container"></div> */}

        <div className="flex-1 p-6 flex flex-col pt-10">
          {step === 1 && (
            <>
              <label className="text-sm font-semibold text-gray-500 mb-2">
                Enter Email Id <span className="text-red-500">*</span>
              </label>
              <div className="flex border border-gray-300 rounded-md overflow-hidden focus-within:border-playoGreen transition">
                {/* 
                // TEMPORARILY DISABLED
                // Phone OTP login is currently hidden.
                // Code preserved for future use.
                {!isEmail && (
                  <div className="bg-gray-50 px-3 py-3 border-r border-gray-300 flex items-center gap-2 text-gray-700 font-medium">
                    + 91 <span className="text-xl">🇮🇳</span>
                  </div>
                )}
                */}
                <input
                  type="email"
                  className="flex-1 p-3 outline-none text-gray-800"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="example@mail.com"
                />
              </div>

              <button
                onClick={handleSendOtp}
                className={`mt-6 w-full py-3 rounded-md font-semibold transition ${contact ? 'bg-[#F2F2F2] text-gray-800 hover:bg-gray-200' : 'bg-gray-100 text-gray-400'}`}
              >
                Send OTP
              </button>

              <div className="mt-8 text-center text-gray-400 text-sm mb-6">or</div>

              {/* 
              // TEMPORARILY DISABLED
              // Phone OTP login is currently hidden.
              // Code preserved for future use.
              <div className="flex justify-center gap-8">
                {!isEmail ? (
                  <button onClick={() => { setIsEmail(true); setContact(""); }} className="flex flex-col items-center gap-2 group">
                    <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 group-hover:bg-gray-50">
                      <Mail size={20} />
                    </div>
                    <span className="text-sm font-medium text-gray-600">Email Id</span>
                  </button>
                ) : (
                  <button onClick={() => { setIsEmail(false); setContact(""); }} className="flex flex-col items-center gap-2 group">
                    <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 group-hover:bg-gray-50">
                      <Smartphone size={20} />
                    </div>
                    <span className="text-sm font-medium text-gray-600">Mobile No</span>
                  </button>
                )}
              </div>
              */}

              <div className="flex justify-center">
                <GoogleLoginButton onSuccess={handleGoogleAuth} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <label className="text-sm font-semibold text-gray-500 mb-2">
                Enter OTP sent to {contact} <span className="text-red-500">*</span>
              </label>
              <div className="flex border border-gray-300 rounded-md overflow-hidden focus-within:border-playoGreen transition">
                <input
                  type="text"
                  className="flex-1 p-3 outline-none text-gray-800"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                />
              </div>

              <button
                onClick={handleVerifyOtp}
                className={`mt-6 w-full py-3 rounded-md font-semibold transition ${otp.length >= 6 ? 'bg-playoGreen text-white' : 'bg-gray-100 text-gray-400'}`}
              >
                Verify OTP
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <label className="text-sm font-semibold text-gray-500 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="flex border border-gray-300 rounded-md overflow-hidden focus-within:border-playoGreen transition">
                <input
                  type="text"
                  className="flex-1 p-3 outline-none text-gray-800"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <button
                onClick={handleVerifyOtp}
                className={`mt-6 w-full py-3 rounded-md font-semibold transition ${name ? 'bg-playoGreen text-white' : 'bg-gray-100 text-gray-400'}`}
              >
                Complete Profile
              </button>
            </>
          )}

        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
