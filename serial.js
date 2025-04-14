// serial.js (fixed)
const { SerialPort } = require('serialport');               // ✅ This extracts the constructor properly
const { ReadlineParser } = require('@serialport/parser-readline');

// Arduino Uno R4 settings
const portPath = 'COM3';
const baudRate = 115200;

// Create SerialPort instance
const serialPort = new SerialPort({
  path: portPath,
  baudRate: baudRate,
  autoOpen: false,
});

// Line-by-line parser
const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// Open the port
serialPort.open((err) => {
  if (err) {
    console.error(`❌ Failed to open serial port ${portPath}:`, err.message);
  } else {
    console.log(`✅ Serial port ${portPath} opened at ${baudRate} baud`);
  }
});

module.exports = {
  serialPort,
  parser,
};
