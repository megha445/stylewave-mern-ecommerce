import { useEffect, useState } from "react";
import { SignIn, SignUp, useAuth } from "@clerk/react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [currentState, setCurrentState] = useState("Login");
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/");
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="flex flex-col items-center w-full pt-14 text-gray-800">
      <div className="inline-flex items-center gap-2 mt-10 mb-2">
        <p className="text-3xl prata-regular">{currentState}</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      <div className="mb-6 flex w-[90%] max-w-96 justify-center gap-2 text-sm">
        {currentState === "Login" ? (
          <button
            type="button"
            onClick={() => setCurrentState("Sign Up")}
            className="cursor-pointer underline-offset-4 hover:underline"
          >
            Create a new account
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentState("Login")}
            className="cursor-pointer underline-offset-4 hover:underline"
          >
            Login here
          </button>
        )}
      </div>

      <div className="min-h-[420px]">
        {currentState === "Login" ? (
          <SignIn
            routing="hash"
            fallbackRedirectUrl="/"
            forceRedirectUrl="/"
            signUpFallbackRedirectUrl="/"
            signUpForceRedirectUrl="/"
          />
        ) : (
          <SignUp
            routing="hash"
            fallbackRedirectUrl="/"
            forceRedirectUrl="/"
            signInFallbackRedirectUrl="/"
            signInForceRedirectUrl="/"
          />
        )}
      </div>
    </div>
  );
};

export default Login;
