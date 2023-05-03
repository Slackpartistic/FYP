import React from 'react'
import { IndividualDataa } from './IndividualDataa'

export const Dataa = (props) => {
    return props.filedetail.map((individualExcelDataa,index)=>(
        <tr key={index}>
            <IndividualDataa individualExcelDataa={individualExcelDataa} />   
            </tr>
    ))
}