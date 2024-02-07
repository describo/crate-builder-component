import dayjs from "dayjs";

export function checkDateIsValid(date) {
    if (!date) return false;
    try {
        date = dayjs(date);
    } catch (error) {
        console.log(error);
    }
    if (date.isValid()) {
        return true;
    } else {
        return false;
    }
}
