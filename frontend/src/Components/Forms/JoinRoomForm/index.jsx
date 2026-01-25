const JoinRoomForm = ()=>{
    return (
               <form className="form col-md-12 mt-5">
            <div className="form-group">
                <input
                    type="text"
                    className="form-control my-2"
                    placeholder="Enter your name"
                />
            </div>
            <div className="form-group border" >
                <div className="input-group d-flex align-items-center justify-content-center gap ">
                    <input
                        type="text"
                        className="form-control my-2 border-0"
                        placeholder="Enter room code"
                    />
                    
                </div>
            </div>
            <button 
            type="submit" 
            className="mt-4 btn btn-primary btn-block form-control"
            >
                Submit
            </button>
        </form>

    )
}
export default JoinRoomForm