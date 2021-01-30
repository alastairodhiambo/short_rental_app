# short_rental_app

- Server-side rendered Short Term Rental Platform built with Node.js and Express.js. 
- MongoDB is used for the Database.
- Handlebars.js is used for the templating engine, with SASS for styling and JS for minor extra functionality.
- Hosted on the Heroku Platform.

## Website Link
https://secure-stream-99879.herokuapp.com

## Contents
- [Pages](#pages)
  - [Home](#home)
  - [Room Listing](#room-listing)
  - [Registration](#registration)
  - [Sign In](#sign-in)
  - [Dashboard](#dashboard)
  - [Room Description](#room-description)

<a id="pages"></a>
# Pages

<a id="home"></a>
## Home

- Allows users to search the room listings by inputting the various search criteria.

<a id="room-listing"></a>
## Room Listing

- Lists all rooms available in the system.

<a id="registration"></a>
## Registration

- Allows a user to register for the platform.
- Adds the user to the database after the input is validated.

<a id="sign-in"></a>
## Sign In Form

- Allows existing users to sign in using the information provided on the database during registration.
- Authentication and Authorization are done using brycptjs and sessions.
- UX is different based on the permissions of the user (host vs normal user).

<a id="dashboard"></a>
## Dashboard

- Welcome page and dashboard that contain the relevant rooms tied to a hosts account with the option to add, edit or delete a room.

<a id="room-description"></a>
## Room Description

- Contains extra relevant information for the particular room selected from the room listing.
- Options on the page are different based on whether the user is logged in or not.
