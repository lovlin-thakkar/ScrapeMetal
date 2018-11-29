var url;
var request = require("request"),
    cheerio = require("cheerio"),
    nodemailer = require('nodemailer'),
    smtpTransport = require('nodemailer-smtp-transport');
var count = 0;
var i = 0;
var methods = {}; //new 

//identifies the site name 
methods.scrape = function site(url, email){
    var siteName = "";
    var index = url.indexOf(".com");
    for(i = index; i>=0 ; i--){
        if(url.charAt(i) == "."){
            siteName = url.substring(i+1, index);
        }
    }
    if(siteName == "" || siteName == "."){
        index = url.indexOf("paytmmall");
        if(index >1){
            siteName = "paytmmall";
        }
        else if(index == -1){
            index = url.indexOf("amazon");
            if(index>1){
                siteName = "amazon";
            }
            else{
                siteName = "error";
            }
        }
    }
    console.log(siteName);
    main(url, siteName, email);
};

//checks the price: stores the first price (updates that whenever a lower price comes up) and compares the next prices with the min price uptil now.
function main(url, siteName, email){

    var oldPrice = 0;
    var priceInt = 0;

    //calls loop() every 20 mins (1 second for testing)
    var timerID = setInterval(loop, 1000); //1sec == 20min

    //this will call stop() after 3 months (10 secs for testing)
    setTimeout(stop, 10000); //startTime + 3months(10sec)

    //stops the loop for scraping again and again
    function stop(){
        clearInterval(timerID);
        return;
    };

    function loop(){
        request(url, function (error, response, body){
            //if the webpage connection is successful we start scraping the HTML we receive
            if(!error){
                //loads body of the HTML into $
                var $ = cheerio.load(body);
                var price;
                //scraping using jQuery Selectors from the loaded body. refer: https://www.w3schools.com/jquery/jquery_ref_selectors.asp
                switch(siteName) {
                    //site specific scraping logic
                    case 'amazon':
                        //amazon keeps prices in 3 types: deal, sale and normal
                        //we take the one which is available (i.e., not empty)
                        var price1 = $("span.a-size-medium.a-color-price[id='priceblock_dealprice']").text().trim();
                        var price2 = $("span.a-size-medium.a-color-price[id='priceblock_saleprice']").text().trim();
                        var price3 = $("span.a-size-medium.a-color-price[id='priceblock_ourprice']").text().trim();
                        if(price1 != ""){
                            price = price1;
                        }
                        else if(price2 != ""){
                            price = price2;
                        }
                        else{
                            price = price3;
                        }
                        break;
                    case 'flipkart':
                        price = $("div._1vC4OE._37U4_g").text().trim();
                        price = price.slice(1);
                        break;
                    case 'paytmmall':
                        price = $("span._1y_y").text().trim();
                        price = price.slice(8);
                        break;
                    case 'snapdeal':
                        price = $("span.payBlkBig").text().trim();
                        break;
                    case 'infibeam':
                        price = $("span.currentPrice").text().trim();
                        price = price.slice(2);
                        break;
                }
                //to remove commas from the price. e.g., 12,344 -> 12344
                price = price.split(',').join(''); //all
                //converts from string to int
                priceInt = parseInt(price);//.slice(1));
                //for testing purposes (artificially reducing the price in the first iteration)
                if(count == 1){
                    //priceInt -= .1; //to artificially decrease the price
                }
                //stores the scraped price into oldPrice
                if(count == 0){
                    oldPrice = priceInt;
                    count++;
                }
                else if(oldPrice>priceInt){
                    //updating the price if it has decreased (if we update each time than this happens: 10 -> 20 -> 15 sends a notification even though the price has increased from 10 to 15)
                    console.log("price decreased");
                    oldPrice = priceInt;
                    //calls the func to send the email
                    sendMessage(email);
                }
                //for developer purpose
                console.log(priceInt);
            }
            else{
                //if the site connection fails, it cant perform scraping.
                console.log("We’ve encountered an error: " + error);
            }
        });
    };
}

//sends an email notifying the decreases price
function sendMessage(email){
    //SMTP for sending an email. the other side user receives it via POP implemented into his mail server (e.g., GMail)
	var transporter = nodemailer.createTransport(smtpTransport({
    	service: 'Gmail',
    	auth: {
      		user: '15bit062@nirmauni.ac.in',
            pass: "don'tstop&paltY29"
    	}
  	}));

	var mailOptions = {
	    from: '15bit062@nirmauni.ac.in',
	    to: email,
	    subject: 'Scraper Node.js Email ',
	    text: 'Price of your wishlisted product just dropped! Go check out fast!'
	};

	transporter.sendMail(mailOptions, function(error, info){
	    if(error){
	    	console.log(error);
	    }
	    else{
	    	console.log('Email sent: ' + info.response);
	    }
	});
}

//to export these methods to the backend files
exports.data = methods;