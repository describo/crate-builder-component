import parseISO from "date-fns/esm/parseISO";
import isDate from "validator/es/lib/isDate";

export function checkDateIsValid(date) {
    try {
        if (!date) return true;
        if (isDate(parseISO(date))) return true;
        if (isDate(date)) return true;
    } catch (error) {}
    return false;
}
