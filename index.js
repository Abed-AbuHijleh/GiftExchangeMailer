// 
// Required External Modules
// 

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const nodeMailer = require("nodemailer");

// 
// App Vars
// 

const normalizePort = (port) => parseInt(port, 10);
const port = normalizePort(process.env.PORT || "8000");

const app = express();
const dev = app.get("env") !== "production";

dotenv.config({ path: "./.env" });

// Other vars

peopleObj = {}

// Default values
globalOccasion = "Secret Santa"
globalBudget = "$50"

// 
// Email Templates + Setup
// 

const transport = nodeMailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const emailTemplate = ({ name0, name1, items }) => {
  listString = "";
  for (i = 0; i < items.length; i++) {
    listString += `<li>${items[i]}</li>`;
  }
  return `
<div>
<h1>Hello ${name0}</h1>
<h2>For ${globalOccasion}, your person is ${name1}</h2>
<p>They want (${globalBudget} budget):</p>
<ul>
${listString}
</ul>
</div>
`;
};

const emailTemplateTest = ({ name, items }) => {
  listString = "";
  for (i = 0; i < items.length; i++) {
    listString += `<li>${items[i]}</li>`;
  }
  return `
<div>
<h1>Hello ${name}</h1>
<h2>This is a test for ${globalOccasion} to confirm the items you want.</h2>
<p>You want (${globalBudget} budget):</p>
<ul>
${listString}
</ul>
<p>If this is correct, please message the organizer (${peopleObj[0]["name"]}).</p>
</div>
`;
};

// 
// Functions
// 

// Fisher-Yates shuffle to figure out who gets who
const getArray = (n) => {
  const arr = Array.from({ length: n }, (_, index) => index);
  for (let i = 0; i < n - 1; i++) {
    const randomIndex = i + Math.floor(Math.random() * (n - i - 1)) + 1;
    [arr[i], arr[randomIndex]] = [arr[randomIndex], arr[i]];
  }

  return arr;
};


// Function to send out the email
const sendEmail = async (email, html, subject) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: html,
  };
  transport.sendMail(mailOptions, (error) => {
    if (error) {
      console.log(error);
    } else {
      console.log(`Sent email to ${email}`);
    }
  });
};

// Sleep (honk-shoe)
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// 
// CORS
// 

if (!dev) {
  app.disable("x-powered-by");
  app.use(cors());
} else {
  app.use(
    cors({
      origin: ["http://localhost:3000", "http://" + process.env.IP + ":3000"],
    })
  );
}

// 
// Start Listening
// 

app.listen(port, () => {
  console.log("Server started on port: " + port);
});

// 
// Middleware function to check for password
// 

// This makes sure that no one can just randomly tamper with the server
// Obviously this isn't the most secure but that doesn't matter for this
const checkPassword = (req, res, next) => {
  const { password } = req.query;
  
  if (password === process.env.SEND_PASSWORD) {
    // If the password matches, continue to the next middleware (or route handler)
    next();
  } else {
    res.status(403).send('Unauthorized: Incorrect password');
  }
};

// Apply the middleware to routes (except /new-entry and /)
app.use((req, res, next) => {
  // Check if the URL doesn't match /new-entry or /
  if (req.path !== '/new-entry' && req.path !== '/') {
    checkPassword(req, res, next);
  } else {
    // For /new-entry and / routes, proceed without password check
    next();
  }
});

// 
// Route Definitions
// 

// Check if server is up
app.get("/", async (_, res) => {
  try {
    res.status(200).send("Server is up!");
  } catch (err) {
    console.log(err);
    res.status(404).send("Error");
  }
});


// Setup info about the gift exchange
app.get("/init", (req, res) => {
  const { budget, occasion } = req.query;

  // Check if both budget and occasion parameters exist in the query
  if (budget && occasion) {
    // Set the global variables budget and occasion to the values from the query parameters
    // Assuming that budget and occasion are globally declared variables or stored in an accessible context
    globalBudget = budget;
    globalOccasion = occasion;

    res.status(200).send(`Budget and Occasion set to ${budget} and ${occasion} respectively.`);
  } else {
    res.status(400).send("Please provide both budget and occasion parameters.");
  }
});


// Send everyone emails about who they got
app.get("/send", async (req, res) => {
  const numberOfPeople = Object.keys(peopleObj).length;

  // Check if there are at least three people registered
  if (numberOfPeople >= 3) {
    participantsGift = getArray(numberOfPeople);

    try {
      for (const i in peopleObj) {
        await sendEmail(
          peopleObj[i]["email"],
          emailTemplate({
            name0: peopleObj[i]["name"],
            name1: peopleObj[participantsGift[i]]["name"],
            items: peopleObj[participantsGift[i]]["items"],
          }),
          `YOUR Person for ${globalOccasion} :)`
        );
        await sleep(1000);
      }
      res.status(200).send("Done");
    } catch (err) {
      console.log(err);
      res.status(404).send("Email(s) failed to send");
    }
  } else {
    res.status(400).send("There should be at least three people registered to send emails.");
  }
});

// Send everyone emails about their own entries
app.get("/test", async (_, res) => {
  try {
    for (const i in peopleObj) {
      await sendEmail(
        peopleObj[i]["email"],
        emailTemplateTest({
          name: peopleObj[i]["name"],
          items: peopleObj[i]["items"],
        }),
        `TESTING - ${globalOccasion}`
      );
      await sleep(1000);
    }
    res.status(200).send("Done");
  } catch (err) {
    console.log(err);
    res.status(404).send("Email(s) failed to send");
  }
});

// Let people add their own info
app.get("/new-entry", (req, res) => {
  try {
    const { name, email, items } = req.query;

    if (name && email && items) {
      // If items is a single item, convert it to an array
      const itemsArray = Array.isArray(items) ? items : [items];

      // Adding a new entry to peopleObj
      const newEntry = {
        name,
        email,
        items: itemsArray,
      };

      // Generating the index for the new entry
      const newEntryIndex = Object.keys(peopleObj).length;

      // Adding the new entry to peopleObj
      peopleObj[newEntryIndex] = newEntry;

      res.status(200).send("New entry added successfully.");
    } else {
      res.status(400).send("Please provide name, email, and items.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to make new entry");
  }
});