import CreateRoomForm from "./CreateRoomForms";
import JoinRoomForm from "./JoinRoomForm";
import "./index.css";

const Forms = () => {
  return (
    <div className="row h-100 pt-5">

      {/* CREATE ROOM */}
      <div className="col-md-4 mt-5 mx-auto">
        <div className="form-box p-3 border border-primary rounded-2 d-flex align-items-center flex-column">
          <h1 className="text-primary fw-bold mb-3 ">
            Create Room
          </h1>
          <CreateRoomForm />
        </div>
      </div>

      {/* JOIN ROOM */}
      <div className="col-md-4 mt-5 mx-auto">
        <div className="form-box p-3 border border-primary rounded-2 d-flex align-items-center flex-column">
          <h1 className="text-primary fw-bold mb-3">Join Room</h1>
          <JoinRoomForm />
        </div>
      </div>

    </div>
  );
};

export default Forms;
