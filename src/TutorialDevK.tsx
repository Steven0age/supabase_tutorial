import { createClient, Session } from "@supabase/supabase-js";
import { Database } from "./supabase";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useEffect, useState } from "react";

const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_TOKEN
);

function TutorialDevK() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    fetchSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("session: ", session);
      console.log("event: ", event);
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log("fetchSession error: ", error);
    } else {
      setSession(data.session);
      console.log("fetchSession data: ", data);
    }
  }

  async function signInWithGithub() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
    });
    console.log("signInWithGithub suceeded");
    console.log("signInWithGithub data: ", data);
    console.log("signInWithGithub error: ", error);
  }

  async function logOut() {
    supabase.auth.signOut();
  }

  // async function fetchData() {
  //   const { data, error } = await supabase
  //     .from("Test")
  //     .select("Name")
  //     .filter("Name", "eq", "Hallo");

  //   if (error) {
  //     console.log("fetchData error: ", error);
  //   }
  //   console.log("fetchData data: ", data);
  //   return data;
  // }

  //fetchData();

  if (!session) {
    return (
      <div>
        <h2>Login "standardmäßig" via Button</h2>
        <button onClick={signInWithGithub}>Sign in with Github</button>
        <hr />
        <h2>Login via Auth UI</h2>
        {/*  //Authenticatio with AuthUI: //*/}
        <Auth
          appearance={{ theme: ThemeSupa }}
          supabaseClient={supabase}
          providers={["github"]}
        />
      </div>
    );
  } else {
    return (
      <div>
        <h2>Congrats! Du bist eingeloggt</h2>
        <button onClick={logOut}>click to logout</button>
        <hr />
        <h2>Login via Auth UI</h2>
        <p>Leer - Nicht möglich, da bereits eingeloggt.</p>
      </div>
    );
  }
}

export default TutorialDevK;
