declare const days: readonly ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

type Time = `${Exclude<Digit, '0'> | `${Exclude<Digit, '0'>}${Digit}`}:${Digit}${Digit} ${'AM' | 'PM'}`;

type Shift = {
    day: typeof days[number];
    date: [number, number, number];
    shift: {
        start: Time;
        end: Time;
        type: 'REG' | 'TRANSFER';
    } | {
        type: 'PTO' | 'JUR' | 'OFF' | 'UNP' | 'FLT';
    };
};

type EmployeeShift = {
    name: string;
    title: string;
    shifts: Shift[];
}

type EmployeeShifts = EmployeeShift[]
