import AppRoutes from "./routes/AppRoutes";
import ChatWidget from "./components/chatbot/ChatWidget";
import { Navbar } from "./components/lovable/Navbar";
import { Footer } from "./components/lovable/Footer";

function App() {
  return (
    <>
      <Navbar />
      <AppRoutes />
      <Footer />
      <ChatWidget />
    </>
  );
}

export default App;
