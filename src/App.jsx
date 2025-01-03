import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Incident from "./components/Incident";

function App() {
  return (
    <>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col mr-6">
          <Header />
          <Incident />
        </div>
      </div>
    </>
  )
}

export default App
