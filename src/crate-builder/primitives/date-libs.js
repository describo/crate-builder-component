import { parseISO } from "date-fns";
import isDate from "validator/es/lib/isDate.js";

export function checkDateIsValid(date) {
    if (!date) return false;
    try {
        date = parseISO(date);
    } catch (error) {}
    if (isDate(date)) {
        return true;
    } else {
        return false;
    }
}
