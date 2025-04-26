export default {
    icsDate(_date, timeString: Time) {
        // Parse the time string
        const [time, ampm] = timeString.split(" ");
        let [hours, minutes] = time.split(":").map(Number);

        // Convert to 24-hour format
        if (ampm === "PM" && hours !== 12) {
            hours += 12;
        } else if (ampm === "AM" && hours === 12) {
            hours = 0;
        }

        // Create a Date object (month is 0-indexed)
        const date = new Date(_date[2], _date[0] - 1, _date[1], hours, minutes);
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    },
    generateEvent(name, shift: Shift) {
        if (shift.shift.type !== "PTO" && shift.shift.type !== "UNP" && shift.shift.type !== "FLT" && shift.shift.type !== "JUR") {
            const jsDate = {
                start: this.icsDate(shift.date, shift.shift.start),
                end: this.icsDate(shift.date, shift.shift.end),
            }

            const nowAsTimestamp = (new Date(Date.now())).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

            const newContent = `BEGIN:VEVENT
UID:${name.split(",")[0] + jsDate.start}-4206969@example.com
SUMMARY:${name} ${shift.shift.type == "TRANSFER" ? "[Transfer]" : ""}
TRANSP:TRANSPARENT
DTSTAMP:${nowAsTimestamp}
DTSTART:${jsDate.start}
DTEND:${jsDate.end}
CATEGORIES: ${name.replace(", ", "").replace(" ", "")}
DESCRIPTION:
END:VEVENT
`;

            return newContent;
        } else return ""
    },
    async generateFile(data: EmployeeShifts) {
        let icsContent =
            "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Julian Sanchez//NONSGML UKGtoICS//EN\n";
        for (const employee of data) {
            for (const shift of employee.shifts) {
                console.log(shift)
                icsContent += await this.generateEvent(employee.name, shift)
            }
        }
        icsContent += "END:VCALENDAR";
        Bun.write(Date.now() + "-output.ics", icsContent)
    }
}