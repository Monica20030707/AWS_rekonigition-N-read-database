import { RekognitionClient, DetectTextCommand } from "@aws-sdk/client-rekognition";
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';


const rekognitionClient = new RekognitionClient({});
const sqsClient = new SQSClient({});
const client = new S3Client({});
const eventBridgeClient = new EventBridgeClient({});

export const handler = async (event) => {
    const bucket = event.Records[0].s3.bucket.name;
    const key = event.Records[0].s3.object.key;
    
    const com = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });
    
    const params = {
        Image: {
            S3Object: {
                Bucket: bucket,
                Name: key
            }
        }
    };
    
    const firstResponse = await client.send(com);
    const command = new DetectTextCommand(params);

    try {
        
        const datetime = firstResponse.Metadata["datetime"];
        const type = firstResponse.Metadata["type"];
        const location = firstResponse.Metadata["location"];
        
        const response = await rekognitionClient.send(command);
        
        let plateNumber = '';
        let state = '';
        const states = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 
        'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 
        'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 
        'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 
        'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 
        'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
        'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 
        'Wyoming'].map(state => state.toLowerCase());;


        const regex = new RegExp("^[A-Z0-9]*$");

        for (const text of response.TextDetections) {
            const detectedText = text.DetectedText.toLowerCase();

        if (states.includes(detectedText)) {
            state = detectedText.charAt(0).toUpperCase() + detectedText.slice(1);
        } else if (detectedText.length === 7 && regex.test(detectedText.toUpperCase())) { 
            plateNumber = detectedText.toUpperCase();
        }
        if (state === 'California' && plateNumber) {
            await sendToQueue(plateNumber, datetime, type, location);
            break;
        }
    }
    
    if (state !== 'California' && state && plateNumber) {
        await sendToEventBridge({plateNumber, state, datetime, type, location });
    }

        return {
            statusCode: 200,
            body: JSON.stringify({
                response,
                plateNumber: plateNumber,
                state: state
            })
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
const sendToEventBridge = async (plateNumber, state, datetime, type, location) => {
    const params = {
        Entries: [
            {
                EventBusName: 'default',
                Source: 'my.lambda.function', 
                DetailType: 'Vehicle Information', 
                MessageBody: JSON.stringify({ 
                    plateNumber: plateNumber, 
                    state: state,
                    datetime: datetime, 
                    type: type, 
                    location: location 
                }),
            },
        ],
    };

    try {
        const result = await eventBridgeClient.send(new PutEventsCommand(params));
        console.log("Success sending event to EventBridge. Event ID:", result.Entries[0].EventId);
        console.log("Status Code: ", result.$metadata.httpStatusCode);

    } catch (err) {
        console.error("Error sending event to EventBridge", err);
    }
};

async function sendToQueue(plateNumber, datetime, type, location) {
    const queueUrl = 'https://sqs.us-east-1.amazonaws.com/165128352564/DownwardQueue'; 
    const params = {
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({ 
            plateNumber: plateNumber, 
            datetime: datetime, 
            type: type, 
            location: location 
        }),
    };

    try {
        const data = await sqsClient.send(new SendMessageCommand(params));
        console.log("Success sending message to SQS. MessageID:", data.MessageId);
    } catch (err) {
        console.error("Error", err.stack);
        throw new Error(`Error sending message to SQS: ${err.message}`);
    }
}