import { useEffect, useState } from "react";
import { Login } from "./screens/Login";
import { SignUp } from "./screens/SignUp";

function useHash(): string {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const update = () => {
      setHash(window.location.hash);
    };
    window.addEventListener("hashchange", update);
    return () => {
      window.removeEventListener("hashchange", update);
    };
  }, []);
  return hash;
}

export function App() {
  const hash = useHash();
  return hash === "#/signup" ? <SignUp /> : <Login />;
}
