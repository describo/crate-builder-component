import { parseISO } from "date-fns";
import isDate from "validator/lib/isDate";

export function checkDateIsValid(date) {
    try {
        if (!date) return true;
        if (isDate(parseISO(date))) return true;
        if (isDate(date)) return true;
    } catch (error) {}
    return false;
}
