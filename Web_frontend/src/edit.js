  import React, { useState,useEffect} from "react";
import { useNavigate,useLocation} from "react-router-dom";
import Axios from "axios";
import "./App.css";

function Edit (props){
  const [isadded,setadded]=useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [showalert, setshowalert] = useState(false);
  const [adminname, setadminname] = useState([]);
  const [selectedOption, setSelectedOption] = useState('');
  const navigate=useNavigate();
  const location = useLocation();
  const fileId = location.state && location.state.fileId;
  const [nameInput, setNameInput] = useState("");
  const [rooms,setrooms]=useState([]);
  const [invig,setinvig]=useState([]);
  const [span1,setspan1]=useState(false);
  const [span2,setspan2]=useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(null);
  // add a new empty row to the isadded state array
  const addNewRow = () => {
    const matchingInvig = invig.find(invigilator => invigilator.Name === nameInput);
    const matchingName=isadded.find(invigilator => invigilator.Name === nameInput);
    if (!matchingInvig) {
      setspan1(true); 
      setNameInput("");
      setSelectedOption("");
    } 
    else if (matchingName){
        setspan2(true);
      setNameInput("");
      setSelectedOption("");
    }
    else { 
    Axios.get(`http://localhost:3001/idss?name=${nameInput}`).then((response) => {
    const maxId = Math.max(...isadded.map((row) => row.Id), 0);
    setadded([
      ...isadded,
      {
        Id: maxId + 1,
        File_ID: isadded.length > 0 ? isadded[0].File_ID : "",
        User_ID: response.data[0].usr_ID,
        Name: nameInput,
        Status: 'A',
        Room: selectedOption,
        Latitude: null,
        Longitude: null,
      },
    ]);
    setNameInput("");
    setSelectedOption("");
    setTimeout(function() {
      window.scroll({
        top: document.documentElement.scrollHeight,
        left: 0,
        behavior: 'smooth'
      });
    }, 1);    
  })}
};
  
  function nav(){
    navigate("/file",{
      state:{fileId:fileId}
    });
  }

  function navv(){
    navigate("/");
    props.handleLogout();
    window.location.reload();
  }

  const handlelogout = () => {
    setshowalert(true);
  }
  const handleconfirm = () => {
    setshowalert(false);
    navv();   
  };

  const handlespan=()=>{
    setspan1(false);
    setspan2(false);
  }

  const handlecancel = () => {
    setshowalert(false);
  };


  useEffect(() => {
    const dateTime = new Date();
    setCurrentDateTime(dateTime.toLocaleString());
    Axios.get("http://localhost:3001/getuserid").then((response) => {
    const id = response.data;
    Axios.get(`http://localhost:3001/adminname?id=${id}`).then(
        (response) => {
        setadminname(response.data);
        }
    );
    });
    Axios.get(`http://localhost:3001/vview?fileId=${fileId}`).then((response) => {
    setadded(response.data);
    });
    Axios.get(`http://localhost:3001/rooms?fileId=${fileId}`).then((response) => {
      setrooms(response.data);
    });
    Axios.get(`http://localhost:3001/invig`).then((response) => {
      setinvig(response.data);
    });
}, [])

  const handlesave = () => {
      setShowAlert(true);
  }

  const handleConfirm = async () => {
    Axios.post('http://localhost:3001/delete-and-insert?fileId=' + fileId, {
      data: isadded,currentDateTime: currentDateTime
    });
      setShowAlert(false);
      nav();
      window.location.reload();
  };

  const handleCancel = () => {
      setShowAlert(false);
  };

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
    e.target.blur();
  };

  const Print = ({ isadded }) => {
      return (
      <>
          {isadded.map((val, key) => {
          return (
              <tr key={key}>
              <td>{val.Id}</td>
              <td>{val.File_ID}</td>
              <td>{val.User_ID}</td>
              <td>{val.Name}</td>
              <td>{val.Status}</td>
              <td>{val.Room}</td>
              <td>{val.Latitude}</td>
              <td>{val.Longitude}</td>
              </tr>
          );
          })}        
      </>
      );
    };

    return (
        <div className="app">
        <div>
        <p className="bahria">
          Bahria University
          <button
            onClick={handlelogout}
            style={{marginLeft: "1180px",fontSize: "20px",backgroundColor: "#355E3B",color: "white",border: "none"}}>
            {adminname} <span style={{ fontSize: 15 + "px" }}>▼</span>
          </button>
        </p>
        {showalert && (
            <div className="alert-background">
            <div className="alert">
                <p style={{fontSize:19+'px'}}>Are you sure you want to Logout!</p>
                <button onClick={handleconfirm} className='btn btn-success' style={{marginLeft:450+'px', width:100+ 'px'}}>Yes</button>
                <button onClick={handlecancel} className='btn btn-success' style={{marginLeft:20+'px',width:100+ 'px'}}>No</button>
            </div>
            </div>)}
        <p className="for"><b>Exam Office</b></p>
        <div className="record">
            <h4><b><u>Edit:</u></b></h4>
            <br></br><br></br>

            <form onSubmit={(e) => {
            e.preventDefault(); 
            addNewRow();
            }}>
             {span1 && <span className="error" style={{marginLeft:'130px'}}>User does not exist</span>}
              {span2 && <span className="error" style={{marginLeft:'90px'}}>User is already assigned a duty</span>}
            <h4 style={{display: 'flex', alignItems: 'center'}}>
              <p style={{marginRight:'20px', fontSize:'20px'}}><b>Name:</b></p>
              <input type="text" style={{ width: 200 + 'px',height:'38px' ,marginBottom: 12 + 'px', marginRight: 70 + 'px', cursor:'inherit',fontSize:'17px',textAlign:'center' }} 
                value={nameInput} placeholder="----Click to Enter----" onClick={handlespan} onChange={(e) => setNameInput(e.target.value)} required></input>
              <p style={{marginRight: '20px' , marginLeft:'40px',fontSize:'20px'}}><b>Room:</b></p>
              <select className='form-control'
                style={{ width: 200 + 'px',height:'38px' ,marginBottom: 12 + 'px', marginRight:'500px', cursor:'pointer'}} value={selectedOption} onChange={handleOptionChange} required>
                 <option value=''>----Click to Select----</option>
                {Array.from(new Set(rooms.map(room => room.Room))).map(room => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
            </h4>
            <button type="submit" style={{ cursor: 'pointer', backgroundColor: 'grey',textAlign: 'center', color: 'white', fontSize: '24px', padding: '5px', borderRadius: '5px',width:'1425px',border:'none'}}>
              Add
            </button>
          </form>
            <br></br><br></br><br></br>
            <table className='table table-bordered'>
              <thead>
                <tr className=' '>
                  <th scope='col'>No.</th>
                  <th scope='col'>File Id</th>
                  <th scope='col'>Faculty Id</th>
                  <th scope='col'>Name</th>
                  <th scope='col'>Status</th>
                  <th scope='col'>Room</th>
                  <th scope='col'>Latitude</th>
                  <th scope='col'>Longitude</th>
                </tr>
              </thead>  
              <tbody>
              <Print isadded={isadded} />
              </tbody>
            </table>
            <br></br>
            <button type='submit' className='btn btn-success' onClick={nav} style={{marginLeft:1198, width: 100}} >Go Back</button>    
            <button type='submit' className='btn btn-success' onClick={handlesave} style={{marginLeft:20, width: 100}} >Save</button>
            {showAlert && (
            <div className="alert-background">
            <div className="alert">
                <p style={{fontSize:19+'px'}}>Are you sure you want to keep the changes</p>
                <button onClick={handleConfirm} className='btn btn-success' style={{marginLeft:450+'px', width:100+ 'px'}}>Yes</button>
                <button onClick={handleCancel} className='btn btn-success' style={{marginLeft:20+'px',width:100+ 'px'}}>No</button>
            </div>
            </div>
      )}
          </div>
        </div>
    </div>  
    );
}
export default Edit;
