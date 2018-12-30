export const getDatetimeLocal = () => {
    const date = new Date();
    const isoDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
    return isoDate.substr(0,19);
}