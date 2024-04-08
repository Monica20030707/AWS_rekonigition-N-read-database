/*
Monica Nguyen 
Cloud Computing
3/10/2024

This file will take messages from DownwardQueue, send it to UpwardQueue
then delete the messages from DownwardQueue, also creating a log to check
if Vehicle Plates is readable.
*/

const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, SendMessageCommand } = require("@aws-sdk/client-sqs");
const fs = require('fs');
var moment = require('moment');

const jsonFilePath = 'DMVDatabase.json';
const logFileName = 'DMVDatabase.log';
const sqsClient = new SQSClient({ region: 'us-east-1' });
const downwardQueue = 'https://sqs.us-east-1.amazonaws.com/770799047975/DownwardQueue'; // URL for the downward SQS queue
const upwardQueue = 'https://sqs.us-east-1.amazonaws.com/770799047975/UpwardQueue'; // URL for the upward SQS queue


function writeToLogFile(message) {
    const timestamp = moment().format('YYYY-MM-DD hh:mm:ss');
    let content = `Date: ${timestamp}: ${message}\n`;

    fs.appendFile(logFileName, content, err => {
        if (err) {
            console.error(err);
        }
    });
}

/// Async function to receive messages from the downward queue
async function receiveFromDownwardQueue() {
    // Create a command to receive messages from the specified queue
    const command = new ReceiveMessageCommand({
        QueueUrl: downwardQueue,
        MaxNumberOfMessages: 1, // Specify the max number of messages to receive
    });

    try {
        // Send the command to SQS and wait for the response
        const { Messages } = await sqsClient.send(command);
        // Check if there are any messages received
        if (Messages && Messages.length > 0) {
            const message = Messages[0];
            writeToLogFile(`License Queue message: ${message.Body}`);

            const messageBody = JSON.parse(message.Body);
            const plateNumber = messageBody.plateNumber;
            const dateTime = messageBody.datetime;
            const type = messageBody.type;
            const location = messageBody.location;

            // Query the insurance database for details based on patientId
            const ownerInfo = await queryDMVDatabase(plateNumber);

            // Send the queried insurance details to the upward queue
            await sendToUpwardQueue({
                plateNumber,
                dateTime,
                type,
                location,
                ... ownerInfo,
            });

            // Create a command to delete the processed message from the queue
            const deleteCommand = new DeleteMessageCommand({
                QueueUrl: downwardQueue,
                ReceiptHandle: message.ReceiptHandle, // Use the receipt handle to identify the message
            });
            // Send the delete command to SQS
            await sqsClient.send(deleteCommand);
        }
    } catch (err) {
        console.error(err);
    }
}

// Async function to query insurance database from an XML file
async function queryDMVDatabase(plateNumber) {
    try {
        const jsonFile = fs.readFileSync(jsonFilePath, 'utf8');
        const jsonData = JSON.parse(jsonFile);

        const vehicles = jsonData.dmv.vehicle;

        // Iterate over the patients to find a match by license plate
        for (let i = 0; i < vehicles.length; i++) {
            if (vehicles[i].plate === plateNumber) {
                return {
                    make: vehicles[i].make,
                    model: vehicles[i].model,
                    color: vehicles[i].color,
                    owner_language: (vehicles[i].owner).preferredLanguage,
                    owner_name: (vehicles[i].owner).name,
                    owner_contact: (vehicles[i].owner).contact
                };

            }
        }
        // Return a default response if no matching patient
        return {
            policyNumber: 'none',
            provider: 'none'
        };

    } catch (error) {
        console.error("Error querying insurance database:", error);
        throw error;
    }
}

// Async function to send response messages to the upward queue
async function sendToUpwardQueue(responseMessage) {
    // Create a command to send a message to the specified queue
    const command = new SendMessageCommand({
        QueueUrl: upwardQueue,
        MessageBody: JSON.stringify(responseMessage),
    });

    try {
        // Send the command to SQS
        await sqsClient.send(command);

    } catch (err) {
        console.error(err);
    }
}

// Schedule the receiveFromDownwardQueue function to run every 5 seconds
setInterval(receiveFromDownwardQueue, 5000);