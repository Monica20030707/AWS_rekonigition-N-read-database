/*
Monica Nguyen 
Cloud Computing
3/10/2024

This file will upload the file from my computer using the path and will reach the S3 Bucket.
*/

const fs = require("fs");
// var convert = require("xml-js");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const awsRegion = "us-east-1";
const s3BucketName = "project3-uploadlicenseplate";

async function main() {

  const [fileName, fileContent, metadata] = readImage();

  try {
    await uploadToS3(fileName, fileContent, metadata);
    console.log("Picture File has been uploaded to S3 Bucket!");

  } catch (error) {
    console.log("Error in uploading: ", error);
  }
}

async function uploadToS3(fileName, fileContent, metadata) {
  const s3 = new S3Client({ region: awsRegion });

  const params = {
    Bucket: s3BucketName,
    Key: fileName,
    Body: fileContent,
    Metadata: metadata,
    ContentType: 'image/jpeg'
  };

  await s3.send(new PutObjectCommand(params));
}

function readImage() {
  const args = process.argv.slice(2);

  // Extracting file path and file type from command line arguments
  const filePath = args[0];
  // const fileType = args[1];

  let fileContent = fs.readFileSync(filePath);

  const metadata = {
    Location: 'Petrovitsky St and 116th AVE intersection, Renton',
    DateTime: '3/18/2024 2:47:45 PM',
    Type: 'no_right_on_red'
  }; 

  // This will read the path of the file in my computer path

  return [filePath.split("/").pop(), fileContent, metadata];
}

main();

//function convertXmlToJson(xml) {
//  return convert.xml2json(xml, { compact: true, spaces: 4 });
//}