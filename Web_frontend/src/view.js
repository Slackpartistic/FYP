import React, { useState, useEffect } from "react";
import Axios from "axios";
import "./App.css";
import { useNavigate } from "react-router-dom";
import { Dataa } from "./Components/Dataa";

function View(props) {
  const { handleLogout } = props;
  const [filedetail, setfiledetail] = useState([]);
  const [adminname, setadminname] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const navigate = useNavigate(); 
  const [file, setfile] = useState(false);

  function nav() {
    navigate("/uploadexcel");
  }

  function navv(){
    navigate("/");
    handleLogout();
    window.location.reload();
  }

  const handlelogout = () => {
    setShowAlert(true);
  }

  const handleConfirm = () => {
    setShowAlert(false);
    navv();   
  };

  const handleCancel = () => {
    setShowAlert(false);
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
    Axios.get("http://localhost:3001/file").then((response) => {
      setfiledetail(response.data);
      if (response.data.length > 0) {
        setfile(true);
      }
    });
  }, []);

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
        {showAlert && (
            <div className="alert-background">
            <div className="alert">
                <p style={{fontSize:19+'px'}}>Are you sure you want to Logout!</p>
                <button onClick={handleConfirm} className='btn btn-success' style={{marginLeft:450+'px', width:100+ 'px'}}>Yes</button>
                <button onClick={handleCancel} className='btn btn-success' style={{marginLeft:20+'px',width:100+ 'px'}}>No</button>
            </div>
            </div>
      )}
        <p className="for">
          <b>Exam Office</b>
        </p>
        <br></br>
        <button
          type="submit"
          className="btn btn-success"
          onClick={nav}
          style={{ marginLeft: 1375 + "px" }}>
          + Upload File
        </button>
        <br></br>
        <br></br>
        {file && (
          <div className="viewer">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>File ID</th>
                  <th>Uploaded By</th>
                  <th>Name</th>
                  <th>Session</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Total Records</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <Dataa filedetail={filedetail} />
              </tbody>
            </table>
          </div>
        )}
        <div className="container">
          <br></br>
          {!file && <div className="vviewer">No Record Found.</div>}
        </div>
      </div>
    </div>
  );
}

export default View;
