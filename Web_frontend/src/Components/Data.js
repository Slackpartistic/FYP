import React from 'react'
import { IndividualData } from './IndividualData'

export const Data = ({isadded}) => {
    return isadded.map((individualExcelData)=>(
        <tr key={individualExcelData.Id}>
            <IndividualData individualExcelData={individualExcelData}/>    
        </tr>
        
    ))
}