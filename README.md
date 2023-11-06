# GiftExchangeMailer
 Was first a test to send emails with Node.js. Turned it into a Secret Santa tool and added some features so I could use it with friends and family. May keep making it overkill with a frontend and better security idk. Will probably add mail-sent verification upon submitting, to both ensure a correct list was placed, as well as a correct email (also prevents trolling).

 <h4>Randomization Algorithm</h4>
To randomly assign everyone a person for the gift exchange, I wanted to make a very simple algorithm. Of course you could just randomize the array, check for errors, and then restart or rectify the errors... but that was too simple and slow for me to want to do it. I then realized that you can procedurally swap each index (except for the last) with any random index after it and it would be impossible to have anyone receive themselves. After whiteboarding the idea and coding it, I discovered its an algorithm that already exists (go figure, it's super simple) called the Fisher-Yates algorithm.

<h3>Current Usage</h3>
<h4>Setup</h4>
Setup a .env file with:
<ul>
  <li>
  SEND_PASSWORD
 </li>
 <li>
  IP
 </li>
  <li>
  PORT
 </li>
  <li>
  EMAIL_SERVICE
 </li>
  <li>
  EMAIL_USER
 </li>
  <li>
  EMAIL_PASSWORD
 </li>
</ul>

The SEND_PASSWORD will be a password that has to be placed into a query in order to do any large scale actions (sending out emails or changing aspects about the exchange). Is it the most secure way of doing this? No. Does that matter? Also no. This is intended to be hosted on a local server to setup a gift exchange without any hassle.

<h4>
 Routes/Usage
</h4>

All routes except for "/" and "/new-entry" require a password in the queries.

<h5>
 "/"
</h5
 This route is just to check for a connection to the API.
 
<h5>
 "/new-entry"
</h5>
This route takes queries name, email, and items. Fill these in to add a user to the list. The items query is a list of items (use an & sign to separate items)
Sidenote: use %20 for spaces and %40 for the @ symbol

<h5>
 "/init"
</h5>
This is used to change the budget and the ocassion on the emails. The default values are "Secret Santa" with a budget of "$50"

<h5>
 "/test"
</h5>
Simply make a request to this route with the passwords and everyone will receive an email with their list of items. Good to check for mistakes before sending out the acutal lists.

<h5>
 "/send"
</h5>
Here we are. The whole purpose of this code. Make a request with the password to this route and everyone will receive an email with their person. No one knows anything, full anonymous, no headaches.

<h3>Happy Gift Giving!</h3>

