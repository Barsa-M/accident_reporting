import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

function App() {
  return (
    <>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col mr-6">
          <Header />
        </div>
      </div>
    </>
  )
}

export default App
