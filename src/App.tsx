import { useCallback, useEffect, useState } from "react";
import { Home } from "./screens/Home";
import { Login } from "./screens/Login";
import { People } from "./screens/People";
import { SignUp } from "./screens/SignUp";
import { Waiting } from "./screens/Waiting";
import type { Session } from "@supabase/supabase-js";
import { myPerson, supabase, type Person } from "./supabase";

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

async function personOf(session: Session | null): Promise<Person | null> {
  return session === null ? null : myPerson(session.user.id);
}

/** The signed-in person: undefined while loading, null when logged out. Plus a reload. */
function usePerson(): [Person | null | undefined, () => void] {
  const [person, setPerson] = useState<Person | null | undefined>(undefined);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Deferred: supabase-js must not be awaited inside its own auth callback.
      setTimeout(() => {
        void personOf(session).then(setPerson);
      }, 0);
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);
  const reload = useCallback(() => {
    void supabase.auth
      .getSession()
      .then(({ data }) => personOf(data.session))
      .then(setPerson);
  }, []);
  return [person, reload];
}

export function App() {
  const hash = useHash();
  const [person, reload] = usePerson();

  if (person === undefined) return null;
  if (person === null) return hash === "#/signup" ? <SignUp /> : <Login />;
  switch (person.role) {
    case "waiting":
      return <Waiting person={person} onCheckAgain={reload} />;
    case "admin":
      return hash === "#/people" ? <People me={person} /> : <Home person={person} />;
    case "nanny":
      return <Home person={person} />;
    default: {
      const unreachable: never = person.role;
      return unreachable;
    }
  }
}
