import { useState, useEffect } from "react";
import "./App.css";
import { AuthPage, MainView, MediaBar } from "./containers";
import { MediaContextProvider } from "./contexts/MediaContext";
import { TasksContextProvider } from "./contexts/TasksContext";
import { createClient, Session } from "@supabase/supabase-js";
import { setRequestInterceptor } from "./util/auth";
import { LoadingSpinnerDiv } from "./components";

export const supabaseClient = createClient("https://znjqhsmhktpfsbwhzixt.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanFoc21oa3RwZnNid2h6aXh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyMTM5OTQsImV4cCI6MjAzNTc4OTk5NH0.C3Vca0J2OQyo0HSUywP8MeX0esefC4gyfOckrwZEaS0");

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data } = supabaseClient.auth.onAuthStateChange((_, session) => {
      setSession(session)
    })
    setRequestInterceptor(async () => {
      const curSession = await supabaseClient.auth.getSession()

      if (curSession.error) {
        throw curSession.error
      } else if (!curSession.data.session) {
        throw new Error("No session")
      } else {
        return curSession.data.session.access_token
      }
    }
    )
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return <LoadingSpinnerDiv />
  } else if (session === null) {
    return <AuthPage />
  } else {
    return (
      <div id="App" >
        <TasksContextProvider>
          <MediaContextProvider>
            <MainView />
            <MediaBar />
          </MediaContextProvider>
        </TasksContextProvider>
      </div >)
  }
}
