import React from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Excel from "./excel";
import Login from "./Login";
import View from "./view";
import File from "./file";
import Edit from "./edit";

function Main(){
    const location = useLocation();
    const navigate = useNavigate();
    
    React.useEffect(() => {
        if (localStorage.getItem("isLoggedIn") === "true" && location.pathname === "/") {
          navigate("/");
        }
        else if (location.pathname !== "/" && localStorage.getItem("isLoggedIn") !== "true") {
          navigate("/");
        }
      }, [location.pathname, navigate]);      

    function handleLogin() {
        localStorage.setItem("isLoggedIn", "true");
      }
      function handleLogout() {
        localStorage.setItem("isLoggedIn", "false");
      }
      
      
    return (
        <Routes>
            <Route path="/" element={<Login handleLogin={handleLogin} />} />
            <Route path="/view" element={<View handleLogout={handleLogout} />} />
            <Route path="/uploadexcel" element={<Excel handleLogout={handleLogout} />} />
            <Route path="/file" element={<File handleLogout={handleLogout} />} />
            <Route path="/edit" element={<Edit handleLogout={handleLogout} />} />
        </Routes>
    )
}
export default Main;
