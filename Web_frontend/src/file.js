import React, { useState,useEffect} from "react";
import { useNavigate,useLocation} from "react-router-dom";
import Axios from "axios";
import "./App.css";
import {Data} from './Components/Data';

function File (props){
    const [showAlert, setShowAlert] = useState(false);
    const [showalert, setshowalert] = useState(false);
    const [adminname, setadminname] = useState([]);
    const [deleteAlert, setdeleteAlert] = useState(false);
    const [editAlert, seteditAlert] = useState(false);
    const [isadded,setadded]=useState([]);
    const [selectedOption, setSelectedOption] = useState('');
    const navigate=useNavigate();
    const location = useLocation();
    const fileId = location.state && location.state.fileId;    

    function nav(){
      navigate("/view")
    }

    function navv(){
      Axios.get(`http://localhost:3001/vview?fileId=${fileId}`).then((response) => {
        const data = response.data;
        let allStatusA = true;
        data.forEach((item) => {
          if (item.Status !== 'A') {
            allStatusA = false;
          }
          if (item.Status === 'P') {
            navigate("/edit",{
              state:{fileId:fileId}
            })
          } 
        });
        if (allStatusA) {
          seteditAlert(true);
        }
      });
    }

    function navvv(){
      navigate("/");
      props.handleLogout();
      window.location.reload();
    }

    const handlelogout = () => {
      setshowalert(true);
    }
    const handleconfirm = () => {
      setshowalert(false);
      navvv();   
    };
  
    const handlecancel = () => {
      setshowalert(false);
    };

    const handleOptionChange = (e) => {
      setSelectedOption(e.target.value);
      e.target.blur();
    };

  useEffect(() => {
    Axios.get("http://localhost:3001/getuserid").then((response) => {
      const id = response.data;
      Axios.get(`http://localhost:3001/adminname?id=${id}`).then(
        (response) => {
          setadminname(response.data);
        }
      );
    });
  if (selectedOption !== '') {
    Axios.get(`http://localhost:3001/view?status=${selectedOption}&fileId=${fileId}`)
      .then(response => {
        setadded(response.data);
      })
  }
  else {
    Axios.get(`http://localhost:3001/vview?fileId=${fileId}`)
      .then((response) => {
        setadded(response.data);
      })
  }
  }, [selectedOption, fileId]);

  const handleDelete = () => {
    Axios.get(`http://localhost:3001/vview?fileId=${fileId}`).then((response) => {
      const data = response.data;
      let allStatusA = true;
      data.forEach((item) => {
        if (item.Status !== 'A') {
          allStatusA = false;
        }
        if (item.Status === 'P') {
          setdeleteAlert(true);
        } 
      });
      if (allStatusA) {
        setShowAlert(true);
      }
    });
  }
  
  const handleConfirm = () => {
    Axios.delete(`http://localhost:3001/delete?fileId=${fileId}`).then((response) => {
  })
    setShowAlert(false);
    nav();   
    window.location.reload();
  }
  
  const handleCancel = () => {
    if (showAlert === true)
      setShowAlert(false);
    if (deleteAlert === true)
     setdeleteAlert(false);
    if (editAlert===true)
    seteditAlert(false);
  }

  const handleDownload = async () => {
    const data = [["No.", "File Id", "Faculty Id", "Name", "Status", "Room", "Latitude", "Longitude", "Last updated"]];
    isadded.map((item)=> data.push([item.Id, item.File_ID, item.User_ID, item.Name, item.Status, item.Room, item.Latitude, item.Longitude, item.Last_updated]));
    const csvContent = data.map(row => row.join(",")).join("\n");
    try {
      const fileHandle = await window.showSaveFilePicker({
        types: [
          {
            description: "CSV file",
            accept: {
              "text/csv": [".csv"],
            },
          },
        ],
      });  
      const writable = await fileHandle.createWritable();
      await writable.write(csvContent);
      await writable.close();
    } catch (err) {
      console.error(err);
    }
  }

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
            </div>
      )}
          <p className="for"><b>Exam Office</b></p>
        <div className="record">
        <h4 style={{display: 'flex', alignItems: 'center'}}>
        <p style={{marginRight: 'auto'}}><u>Record:</u></p>
        <p style={{marginLeft: 'auto'}}>Filter:</p>
        <select
        className='form-control'
        style={{ width: 200 + 'px', marginBottom: 12 + 'px', marginLeft: 15 + 'px', cursor:'pointer' }} value={selectedOption} onChange={handleOptionChange}>
          <option value=''>----Click to Select----</option>
          <option value='A'>Absent</option>
          <option value='P'>Present</option>
      </select>
      </h4>
            <br></br>
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
                  <th scope='col'>File updated at</th>
                </tr>
              </thead>  
              <tbody>
              <Data isadded={isadded} />
              </tbody>
            </table>
            <br></br>
            <button type='submit' className='btn btn-success' onClick={nav} style={{marginLeft:958, width:100} }>Go Back</button>
            <button type='submit' className='btn btn-success' onClick={handleDownload} style={{marginLeft: 20, width: 100}}>Download</button>
            <button type='submit' className='btn btn-success' onClick={navv} style={{marginLeft:20 , width:100} }>Edit </button>
            <button type='submit' className='btn btn-success' onClick={handleDelete} style={{marginLeft:20, width:100} }>Delete</button>
          {showAlert && (
          <div className="alert-background">
          <div className="alert">
            <p style={{fontSize:19+'px'}}>Are you sure you want to delete?</p>
            <button onClick={handleConfirm} className='btn btn-success' style={{marginLeft:450+'px', width:100+ 'px'}}>Yes</button>
            <button onClick={handleCancel} className='btn btn-success' style={{marginLeft:20+'px',width:100+ 'px'}}>No</button>
        </div>
        </div>
      )}
      {deleteAlert && (
        <div className="alert-background">
        <div className="alert">
            <p style={{fontSize:19+'px'}}>Attendance Marked! Cannot be deleted Now.</p>
            <button onClick={handleCancel} className='btn btn-success' style={{marginLeft:590+'px',width:100+ 'px'}}>Ok</button>
        </div>
        </div>
      )}
      {editAlert && (
        <div className="alert-background">
        <div className="alert">
            <p style={{fontSize:19+'px'}} >Cannot Edit! Available when someone is not able to make on scheduled time. </p>
            <button onClick={handleCancel} className='btn btn-success' style={{marginLeft:590+'px',width:100+ 'px'}}>Ok</button>
        </div>
        </div>
      )}
         </div>
      </div>
    </div>
    );
}
export default File;
