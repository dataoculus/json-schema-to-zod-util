#!/usr/bin/env node

const path = require("path");
const { generateZodTypes } = require("./index");

// Specify the root folder paths
const inputRootFolderPath = process.cwd(); // Use the current working directory
const outputRootFolderPath = ""; // Output folder

generateZodTypes(inputRootFolderPath, outputRootFolderPath);
