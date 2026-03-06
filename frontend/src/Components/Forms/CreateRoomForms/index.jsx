import { useState } from "react"
import { useNavigate } from "react-router-dom";
const CreateRoomForm = ({uuid,socket,setUser}) => {
  // const [stateName,setStateName] = useState({name:"ada",age:"24",mob:""});
    const [roomId,setRoomId] = useState("");
    const [name,setName] =  useState("");
    const navigate = useNavigate();
    const handleCreateRoom = (e) => {
        e.preventDefault()
        const roomData = {
            name,
            roomId,
            userId : uuid(),
            host: true,
            presenter: false
        }
        setUser(roomData)
        navigate(`/${roomId}`);
        console.log(roomData);
        socket.emit("userJoined",roomData)
    }
    return (
        <form className="form col-md-12 mt-5">
            <div className="form-group">
                <input
                    type="text"
                    className="form-control my-2"
                    placeholder="Enter your name"
                    value= {name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>
            <div className="form-group " >
                <div className="input-group d-flex align-items-center justify-content-center gap ">
                    <input
                        type="text"
                        value = {roomId}
                        className="form-control m-1 border-0"
                        disabled
                        placeholder="Generate room code"
                    />
                    <div className="input-group-append">
                        <button className="btn btn-primary btn-sm  me-1 " 
                                onClick={() => setRoomId(uuid())} 
                                type="button">
                            generate
                        </button>

                        <button className="btn btn-outline-danger btn-sm me-1" type="button">
                            copy
                        </button>
                    </div>
                </div>
            </div>
            <button 
            type="submit"
            onClick={handleCreateRoom} 
            className="mt-4 btn btn-primary btn-block form-control"
            >
                Generate
            </button>
        </form>

    )
}
export default CreateRoomForm