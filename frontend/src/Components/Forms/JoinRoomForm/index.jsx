import { useState } from "react"
import { useNavigate } from "react-router-dom";
const JoinRoomForm = ({uuid, socket,setUser})=>{
    const [roomId,setRoomId] = useState("");
    const [name,setName] = useState("");
    const navigate = useNavigate();
     
    const handleJoinRoom = (e) =>{
        e.preventDefault();
        const roomData = {
            name,
            roomId,
            userId : uuid(),
            host : false,
            presenter: false
        }
        setUser(roomData);
        navigate(`/${roomId}`);
        socket.emit("userJoined",roomData);
    }
    return (
               <form className="form col-md-12 mt-5">
            <div className="form-group">
                <input
                    type="text"
                    className="form-control my-2"
                    placeholder="Enter your name"
                    value = {name}
                    onChange = {(e)=> setName(e.target.value)}
                />
            </div>
            <div className="form-group border" >
                <div className=" d-flex align-items-center justify-content-center gap ">
                    <input
                        type="text"
                        className="form-control my-2 border-0"
                        placeholder="Enter room code"
                        value = {roomId}
                        onChange = {(e)=> setRoomId(e.target.value)}
                    />
                    
                </div>
            </div>
            <button 
            type="submit" 
            onClick = {handleJoinRoom}
            className="mt-4 btn btn-primary btn-block form-control"
            >
                Submit
            </button>
        </form>

    )
}
export default JoinRoomForm