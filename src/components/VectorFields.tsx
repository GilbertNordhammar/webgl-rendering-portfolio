import React, { useState, useEffect } from 'react';
import { Vector2, Vector3, Vector4 } from "three"
import styled from "@emotion/styled"

type Props = {
    dimensions: 1 | 2 | 3 | 4,
    vectorType: "color" | "position",
    inputType?: "field" | "slider"
    minValue?: number,
    maxValue?: number,
    step?: number,
    defaultValue?: number | Vector2 | Vector3 | Vector4,
    label?: string,
    disableFieldLabels?: boolean,
    onChange: (Vector4) => void
}

const VectorFields = ({
    dimensions, vectorType, inputType, defaultValue, label, minValue, maxValue, step, disableFieldLabels, onChange
}: Props) => {
    const [vector, setVector] = useState(
        defaultValue ?
            dimensions == 1 ? new Vector4(1, 0, 0, 0) : new Vector4(...defaultValue)
            : new Vector4(0, 0, 0, 0)
    )

    useEffect(() => {
        if (onChange)
            onChange(vector)
    }, [vector])

    const labels = vectorType == "color" ?
        ["R", "G", "B", "A"] :
        ["X", "Y", "Z", "W"];

    const indexToVectorField = (index: number): number => {
        switch (index) {
            case 0: return vector.x;
            case 1: return vector.y;
            case 2: return vector.z;
            case 3: return vector.w;
        }
    }

    const inputFields = []
    if (dimensions) {
        for (let i = 0; i < dimensions; i++) {
            inputFields.push(
                <div key={i} style={{ display: "flex" }}>
                    {!disableFieldLabels && <label style={{ paddingRight: "10px" }}>{labels[i]}</label>}
                    <input
                        type={inputType == "slider" ? "range" : "number"}
                        value={indexToVectorField(i)}
                        min={minValue || 0}
                        max={maxValue || 100}
                        step={step || 0.01}
                        onChange={e => {
                            if (i == 0) vector.x = Number(e.target.value)
                            else if (i == 1) vector.y = Number(e.target.value)
                            else if (i == 2) vector.z = Number(e.target.value);
                            else if (i == 3) vector.w = Number(e.target.value);
                            setVector(new Vector4(...vector));
                        }} />
                    {inputType == "slider" && <div>{indexToVectorField(i)}</div>}
                </div>)
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            {label && <div>{label}</div>}
            {inputFields.map(field => field)}
        </div>
    )

}

export default VectorFields