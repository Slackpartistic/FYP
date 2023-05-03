import React from 'react'

export const IndividualData = ({individualExcelData}) => {
    return (
        <>
            <td>{individualExcelData.Id}</td>
            <td>{individualExcelData.File_ID}</td>
            <td>{individualExcelData.User_ID}</td>
            <td>{individualExcelData.Name}</td>
            <td>{individualExcelData.Status}</td>
            <td>{individualExcelData.Room}</td>
            <td>{individualExcelData.Latitude}</td>
            <td>{individualExcelData.Longitude}</td>
            <td>{individualExcelData.Last_updated}</td>
        </>
    )
}
