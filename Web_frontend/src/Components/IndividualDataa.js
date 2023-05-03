import React from 'react';
import { useNavigate } from "react-router-dom";

export const IndividualDataa = (props) => {
    const navigate = useNavigate();
    function nav(fileId) {
        navigate('/file', {
          state: { fileId: fileId }
        });
    }
    return (
        <>
            <td>{props.individualExcelDataa.File_ID}</td>
            <td>{props.individualExcelDataa.user_name}</td>
            <td>{props.individualExcelDataa.Name}</td>
            <td>{props.individualExcelDataa.Session}</td>
            <td>{props.individualExcelDataa.Date}</td>
            <td>{props.individualExcelDataa.Time}</td>
            <td>{props.individualExcelDataa.Total_records}</td>
            <td><p style={{ textDecoration: 'underline', cursor: 'pointer', color: 'blue' }} onClick={() => nav(props.individualExcelDataa.File_ID)}>View Detail</p></td>    
        </>
    )
}
