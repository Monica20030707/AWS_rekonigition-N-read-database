import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
const snsClient = new SNSClient({});

// This function is used to send SNS email to violate user, based on what 
// action they make, which will go with the PGN as we upload.

export const handler = async (event) => {
    for (const record of event.Records) {
        // Parse the message body from the SQS message
        const messageBody = JSON.parse(record.body);

        let ticketAmount = '';

        if (messageBody.type === 'no_stop') {
            ticketAmount = '$300.00';
        } else if(messageBody.type === 'no_right_on_red') {
            ticketAmount = '$125.00';
        } else {
            ticketAmount = '$50.00';
        }


        // Construct the email message
        const emailContent = 
            `Your vehicle was involved in a traffic violation. Please pay the specified ticket amount by 30 days:
            
            Vehicle: ${messageBody.color} ${messageBody.make}, ${messageBody.model}
            License plate: ${messageBody.plateNumber}
            Date: ${messageBody.dateTime}
            Violation address: ${messageBody.location}
            Violation Type: ${messageBody.type}
            Ticket Amount: ${ticketAmount}`
    
        ;

        // Set up parameters for publishing a message to the SNS topic
        const params = {
            Message: emailContent,
            Subject: 'Traffic Violation: You have a Ticket!',
            TopicArn: 'arn:aws:sns:us-east-1:770799047975:TicketDetailsTopic'
        };

        const publishCommand = new PublishCommand(params);
        try {
            const publishResponse = await snsClient.send(publishCommand);
            console.log(`Email sent. Message ID: ${publishResponse.MessageId}`);
        } catch (error) {
            console.error(`Error sending email: `, error);
        }
    }
};