# ScrapeMetal

### About the project:
A price tracker website built using Node.js and MongoDB. 
Works with Amazon, Flipkart, Paytm Mall, Snapdeal & Infibeam as of now.
Onboarding a new e-commerce website is easy.

### How it works:
User has to add the URL of the Product Detail page from the supported e-commerce websites.
Request API to make http calls for scraping the price.
Cheerio for loading the HTML Document Object Model.
Used JQuery Selectors to scrape the price from the loaded DOM.

All this is done in a loop with some delay between two consecutive scrapes, anytime the price drops relative to the starting price, a mail notification is sent to the user.

### Steps to setup:
1. Install [Node.js](https://nodejs.org)
2. Install [MongoDB](https://www.mongodb.com/download-center)
3. Install required packages by running `npm install` in project directory

### Steps to run:
1. Start MongoDB by running `mongod` in command-prompt / terminal
2. Run `mongo` commnd for monoitoring the databse (optional)
3. Start the server by running `npm start` in command-prompt / terminal
