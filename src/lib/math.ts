import { Vector3 } from "three"

export const CompareFloat = (v1: number, v2: number, precision: number): boolean => {
    if (precision < 1) {
        console.error("CompareFloat() expects precision to be >= 1")
        return false
    }
    precision = Math.floor(precision)

    const mult = 10 * precision
    const v1Rounded = Math.round(v1 * mult) / mult
    const v2Rounded = Math.round(v2 * mult) / mult
    return v1Rounded == v2Rounded
}

export const CompareVector3 = (v1: Vector3, v2: Vector3, precision: number): boolean => {
    return CompareFloat(v1.x, v2.x, precision) && CompareFloat(v1.y, v2.y, precision) && CompareFloat(v1.z, v2.z, precision)
}