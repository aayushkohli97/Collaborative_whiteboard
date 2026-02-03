import Forms from "./Components/Forms";
import { Route,Routes } from "react-router-dom";
import RoomPage from "./Pages/RoomPage";

const App = () => {
  return (
    <div className="Container">
      <Routes>
        <Route path = "/" element={<Forms/>} />
        <Route path="/:roomId" element ={<RoomPage/>} />
      </Routes>
    </div>
  );
};

export default App;

