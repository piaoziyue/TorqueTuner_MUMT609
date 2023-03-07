import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
// import { SerialPort } from 'serialport'

const port = new SerialPort({
    path: '/dev/tty.usbserial-020D14BA',
    baudRate: 9600,
});

const parser = port.pipe(new ReadlineParser({ delimiter: ' ' }))
parser.on('data', console.log)
