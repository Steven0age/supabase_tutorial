import { useEffect, useState } from "react";
import { Auth } from "./components/Auth";
import TaskManager from "./components/Taskmanager";
import { supabase } from "./supabase-client";

// thanks to this repo https://github.com/machadop1407/supabase-course
// combined with this tutorial YT video: https://youtu.be/kyphLGnSz6Q?si=rY0AU0h8hcyZzomC
// or click here: https://www.webdevultra.com/video-info/kyphLGnSz6Q

function TutorialPedroTech() {
  const [session, setSession] = useState<any>(null);

  const fetchSession = async () => {
    const currentSession = await supabase.auth.getSession();
    console.log("currentSession:", currentSession);
    setSession(currentSession.data.session);
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  //console.log("session", session);
  return (
    <>
      {session ? (
        <>
          <button onClick={() => logout()}>Log Out</button>
          <TaskManager session={session} />
        </>
      ) : (
        <Auth />
      )}
    </>
  );
}

export default TutorialPedroTech;
