import React,{useState,useEffect} from 'react'
import * as XLSX from 'xlsx'
import "./App.css";
import Axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from "react-router-dom";



function Excel(props) {  
  // on change states
  const [excelFile, setExcelFile]=useState(null);
  const [excelFileError, setExcelFileError]=useState(null);  
  const [date, setdate]=useState(null);
  const [time, setTime] = useState(new Date());
  const [session, setsession]=useState(null);
  const [fileName, setFileName] = useState('');
  const [availableSessions, setAvailableSessions] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [adminname, setadminname] = useState([]);

  
  // submit
  // it will contain array of objects
  const navigate=useNavigate();
  function nav(){
    navigate("/view")
  }
  function navv(){
    navigate("/");
    props.handleLogout();
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
    Axios.get(`http://localhost:3001/sessions?date=${date}`)
    .then(response => {
      setAvailableSessions(response.data);
    });
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [date]);

  // handle File
  const fileType=['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  const handleFile = (e)=>{
    let selectedFile = e.target.files[0];
    setFileName(selectedFile.name);
    if(selectedFile){
      // console.log(selectedFile.type);
      if(selectedFile&&fileType.includes(selectedFile.type)){
        let reader = new FileReader();
        reader.readAsArrayBuffer(selectedFile);
        reader.onload=(e)=>{
          setExcelFileError(null);
          setExcelFile(e.target.result);
        } 
      }
      else{
        setExcelFileError('Please select only excel file types');
        setExcelFile(null);
      }
    }
    else{
      console.log('plz select your file');
    }
  }

  // submit function
  const handleSubmit=(e)=>{
    e.preventDefault();
    if(excelFile!==null){
      const workbook = XLSX.read(excelFile,{type:'buffer'});
      const worksheetName = workbook.SheetNames[0];
      const worksheet=workbook.Sheets[worksheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      const currenttime=time.toLocaleTimeString('en-US', { hour12: true });
      Axios.get('http://localhost:3001/getuserid').then((response)=>{
        const id=response.data
        Axios.post('http://localhost:3001/add',{
          data:data,session,date,fileName,id,currenttime
          });
        });
        nav();  
        window.location.reload();
        }
  }
      
  
  return (
    <div>
      {/* upload file section */}
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
        <p className="for"><b>Exam Office</b></p>
      </div>
      <br></br><br></br>
      <div className="container" id='excel'>
      <div className='form'>
        <form className='form-group' autoComplete="off"
        onSubmit={handleSubmit}>
          <br></br>
          <label><h5>Upload Excel file</h5></label>
          <br></br>
          <input type='file' className='form-control'
          onChange={handleFile} required></input>                  
          {excelFileError&&<div className='text-danger'
          style={{marginTop:5+'px'}}>{excelFileError}</div>}
          <br></br>
          <label><h5>Select Date</h5></label><label style={{marginLeft:250+'px'}}><h5>Select Session</h5></label>
          <br></br>
          <input type='date' className='form-control' style={{width:200+'px'}} required  onChange={e => setdate(e.target.value)}></input>
          <select className='form-control' style={{width:200+'px', marginLeft:350+'px',marginTop:-38+'px'}} required onChange={e => setsession(e.target.value)}>
          <option value="">----Click to Select---- </option>
          {availableSessions.map(session => <option key={session} value={session}>{session}</option>)}
          </select>
          <br></br>
          <button type='submit' className='btn btn-success' 
          style={{marginTop:15+'px',width:100+'px'}}>Submit</button>
        </form>
      </div>
     <br></br>
      </div>
    </div>
  );
}

export default Excel;