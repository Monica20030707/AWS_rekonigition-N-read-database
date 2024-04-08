# Traffic Violation Detection System

## Overview
This project aims to design a system that helps cities in California use cameras installed at road intersections to detect and bill drivers for traffic violations. The system will capture license plate images, process them to extract license plate numbers, determine the type of violation, and then send violation notices via email to the vehicle owners. The system is designed to handle both California and non-California license plates, with different procedures for each.

## Assumptions
1. The system will be installed in cities and towns in the state of California.
2. A California license plate number consists of 7 characters and digits (A to Z and 0 to 9) without custom options.
3. Cameras installed at intersections have Internet access and can communicate with the cloud.
4. Violation notices will be delivered to offenders via email due to budget constraints.
5. All vehicle owners have email accounts, and this information is available in the Department of Motor Vehicle (DMV) database.
6. The DMV database is not in the cloud but located in a local network at the state department of transportation.
7. California DMV does not have access to DMV databases of other states, so non-California license plates are processed differently.
8. License plates are extracted from pictures before being processed by the system.
9. When a license plate picture is uploaded to a cloud S3 bucket, metadata including location, date/time, and violation type is attached to the object.

## System Workflow
When the camera uploads a license plate picture to a cloud S3 bucket, it adds with the object 3 metadata items:

Metadata Description and Value:
- **Location:** Intersection address (e.g., "Main St and 116th AVE intersection, Bellevue").
- **DateTime:** The date and time the violation took place.
- **Type:** The type of violation. Three types are supported:
  - `no_stop`: Vehicle didn’t stop at the red light.
  - `no_full_stop_on_right`: Vehicle didn’t come to a full stop before taking a right on red.
  - `no_right_on_red`: Right turn on red not allowed, but vehicle made a turn.

The type of violation determines the ticket amount the driver must pay:
- `no_stop`: $300.00
- `no_full_stop_on_right`: $75.00
- `no_right_on_red`: $125.00

## Implementation Hints
1. Utilize the UploadData tool for simulating camera uploads.
2. Leverage code from previous projects, especially Project2.
3. Utilize the provided DMVDatabase.xml file for California DMV data.
4. Test the system using the provided license plates (California and non-California).
5. Metadata: 

## Email Format
The email sent to violators will have the following format:

"Your vehicle was involved in a traffic violation. Please pay the specified ticket amount by 30 days:
Vehicle: [Color] [Make] [Model]
License plate: [Plate Number]
Date: [Date/Time of Violation]
Violation address: [Address]
Violation type: [Type of Violation]
Ticket amount: [Ticket Amount]"

For example:
"Your vehicle was involved in a traffic violation. Please pay the specified ticket amount by 30 days:
Vehicle: Blue Ford Escort
License plate: BXT7765
Date: 3/2/2024 2:25:47 PM
Violation address: Main St and 116th AVE intersection, Bellevue
Violation type: no_right_on_red
Ticket amount: $125"

## Functionality
The system should include functionality to:
- Detect and extract license plates from images.
- Determine the type of traffic violation based on metadata.
- Send violation notices via email to vehicle owners.
- Differentiate between California and non-California license plates.
- Process non-California license plates separately for further handling.

## Conclusion
This readme provides an overview of the Traffic Violation Detection System, outlining its objectives, assumptions, workflow, implementation hints, email format, and required functionality. Implementing this system will contribute to improving traffic regulation and safety in California cities and towns.
