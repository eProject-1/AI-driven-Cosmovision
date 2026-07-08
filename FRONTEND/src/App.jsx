import AppRoutes from "./routes/AppRoutes";
import ChatWidget from "./components/chatbot/ChatWidget";
import { SiteFooter } from "./components/layout/SiteFooter";
import { SiteHeader } from "./components/layout/SiteHeader";

function App() {
  return (
    <>
      <SiteHeader />
      <main>
      <AppRoutes />
      </main>
      <SiteFooter />
      <ChatWidget />
    </>
  );
}

export default App;
