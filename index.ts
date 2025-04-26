import * as XLSX from 'xlsx'
import icsHandler from './icsHandler';

const days = [
    "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
] as const;

function parseJSON(data: string[][]): EmployeeShifts | null {
    try {
        const result: EmployeeShifts = [];

        const rawDates = data[0].slice(1)

        const dates = Object.fromEntries(days.map((day, i) => [day, rawDates[i].slice(3).trimStart().split('/').map(n => Number(n))])) as Record<typeof days[number], [number, number, number]>

        for (const employee of data.slice(3)) {
            const employeeNameAndTitle = employee[0].replace(/\r\n.+$/, '');

            const match = employeeNameAndTitle.match(/^(.*?)\s\((.*?)\)$/);

            if (!match) {
                console.error(`Could not parse name and title for ${employeeNameAndTitle}`);
                continue;
            }

            const name = match[1].trim();
            const title = match[2].trim().replace(" B", "");
            const shifts: Shift[] = [];

            const rawShifts = employee.slice(3)

            for (const [_i, day] of Object.entries(days)) {
                const i = Number(_i)

                const rawShift = rawShifts.slice(i * 4, (i * 4) + 4)

                const shiftInOrCode = rawShift[0]

                if (shiftInOrCode === '\n' || shiftInOrCode === '\r\n') {
                    // Unscheduled
                } else if (shiftInOrCode === '') {
                    console.error("this shouldn't happen")
                } else if (shiftInOrCode.includes(':')) {
                    const shiftOut = rawShift[2];

                    const [shiftStart, shiftEnd] = extractShiftTimes(shiftInOrCode, shiftOut);

                    let shiftType: 'REG' | 'TRANSFER' = "REG";
                    if (shiftOut.split('(x)').length === 2) {
                        shiftType = "TRANSFER";
                    }

                    shifts.push({
                        day,
                        date: dates[day],
                        shift: {
                            start: shiftStart,
                            end: shiftEnd,
                            type: shiftType
                        }
                    });
                } else {
                    shifts.push({
                        day,
                        date: dates[day],
                        shift: {
                            type: shiftInOrCode.replace(/ \(x\) (?:Out)|(?:In)$/, '') as Exclude<Shift['shift']['type'], 'REG' | 'TRANSFER'>
                        }
                    })
                }
            }

            result.push({
                name: name,
                title: title,
                shifts: shifts,
            });
        }

        return result;
    } catch (error) {
        console.error("Error parsing JSON:", error);
        return null;
    }
}

function extractShiftTimes(shiftIn: string, shiftOut: string): [Time, Time] {
    const cleanShiftIn = shiftIn.trim().replace(/ \(x\) (?:Out|In)$/, '').replace('A', ' AM').replace('P', ' PM');
    const cleanShiftOut = shiftOut.trim().replace(/ \(x\) (?:Out|In)$/, '').replace('A', ' AM').replace('P', ' PM');

    return [cleanShiftIn as Time, cleanShiftOut as Time];
}

function parseXLSX(filepath: string) {
    const workbook = XLSX.readFile(filepath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    return data;
}

const shiftJSON = parseXLSX(process.cwd() + "/convert.xlsx").map((employee: any) => Object.values(employee)).slice(4) as string[][];

const employeeShifts = parseJSON(shiftJSON);

if (employeeShifts) {
    //await Bun.file('./a_out.json').write(JSON.stringify(employeeShifts, null, 4))
    icsHandler.generateFile(employeeShifts);
}

