import React ,{ useState,useEffect} from "react";
import Axios from "axios";
import "./App.css";
import { useNavigate } from "react-router-dom";


function Login(props) {
  const [errorMessages, setErrorMessages] = useState({});
 const [isSubmitted, setIsSubmitted] = useState(false);
  const [isadded,setadded]=useState([]);

  const navigate=useNavigate();
 
  const database = [    
    {
      username : ' ' ,
      password :' '
    }
  ];
  useEffect(() => {
    Axios.get("http://localhost:3001/admin_login").then((response) => {
      setadded(response.data);
    })
    if (isSubmitted) {
      navigate("/view");
    }  
    }, [isSubmitted,navigate])

  const errors = {
    err: "Invalid Username or Password"
  };

  const handleInputChange = (event) => {
    setErrorMessages({});
  };

  const handleSubmit = (event) => {
    database.username=isadded.map(x=>x.Email);
    database.password=isadded.map(x=>x.Password);

    //Prevent page reload
    event.preventDefault();

    var { uname, pass } = document.forms[0];
    let email=uname.value;
    if(database.username[0]===email )
    {
      if (database.password[0] !== pass.value) {
        // Invalid password
        setErrorMessages({ name: "pass", message: errors.err });
        event.target.elements.pass.value = ""; 
      } else {
        setIsSubmitted(true);
        Axios.post("http://localhost:3001/userid",{email});
        props.handleLogin();
      }
    }
     else if (database.username[1]===uname.value)
     {
      if (database.password[1] !== pass.value) {
        // Invalid password
        setErrorMessages({ name: "pass", message: errors.err });
        event.target.elements.pass.value = "";
      } else {
        setIsSubmitted(true);
        Axios.post("http://localhost:3001/userid",{email});
        props.handleLogin();
      }
    }
    else if (database.username[2]===uname.value)
    {
     if (database.password[2] !== pass.value) {
       // Invalid password
       setErrorMessages({ name: "pass", message: errors.err });
       event.target.elements.pass.value = "";
     } else {
       setIsSubmitted(true);
       Axios.post("http://localhost:3001/userid",{email});
       props.handleLogin();
     }
   }
   else if (database.username[3]===uname.value)
   {
    if (database.password[3] !== pass.value) {
      // Invalid password
      setErrorMessages({ name: "pass", message: errors.err });
      event.target.elements.pass.value = "";
    } else {
      setIsSubmitted(true);
      Axios.post("http://localhost:3001/userid",{email});
      props.handleLogin();
    }
  }
  else {
    setErrorMessages({ name: "pass", message: errors.err });
    event.target.elements.pass.value = "";
  }
  }
      
  // Generate JSX code for error message
  const renderErrorMessage = (name) =>
    name === errorMessages.name && (
      <div className="error">{errorMessages.message}</div>
    );

  // JSX code for login form
  const renderForm = (
    <div className="form">
    <form onSubmit={handleSubmit}>
        <div className="input-container">
          <label><b>Email:</b> </label>
          <input type="text" name="uname" required onClick={handleInputChange}/>
          {renderErrorMessage("uname")}
        </div>
        <div className="input-container">
          <label><b>Password:</b> </label>
          <input type="password" name="pass" required onClick={handleInputChange}/>
          {renderErrorMessage("pass")}
        </div>
        <div className="button-container">
        <button type='submit' className='btn btn-success' style={{marginTop:25+'px',width:100+'px'}} >Login</button>
        </div>
      </form>
    </div>
  );
  return (
    <div className="app">
      <div>
      <p className="bahria">Bahria University</p>
        <p className="for"><b>Exam Office</b></p>
      </div>
        <div className="login-form">
          <div className="title"><b>Sign In</b></div>
          {renderForm}
        </div>
    </div>
  );
}
export default Login;