const express = require("express")
const bodyParser = require("body-parser")
const https = require("https")
const { response } = require("express")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const { equal } = require("assert")


mongoose.connect("mongodb://localhost:27017/iCrowdDB", {useNewUrlParser: true})

var confpass = "pass"
//Setting up DB schema
const userSchema = new mongoose.Schema(
    {
        // _id: Number,
        country: {
            type: String,
            required: [true, 'Please select a country']
            
        },
        fname: {
            type: String,
            required: [true, 'First name is required']
        },
        lname: {
            type: String,
            required: [true, 'Last name is requred']
        },
        
        email: {
            type: String,
            required: [true, 'Please enter an email'],
            match: [/[\w-]+@([\w-]+\.)+[\w-]+/, 'email is not valid'],
           
        },
        password: {
            type: String,
            required: [true, 'Please enter a password'],
            minlength: [8, 'Password must be at least 8 characters'],
            
        },
        address: {
            type: String,
            required: [true, 'Please enter your street address']
        },
        city: {
            type: String, 
            required: [true, 'Please enter your city']
        },
        state: {
            type: String,
            required: [true, 'Please enter your state']
        },
        postcode: {
            type: String,
            
            
        },
        number: {
            type: String,
            minlength: [10, 'Your mobile number must be 10 digits starting with 04'],
            minlength: [10, 'Your mobile number must be 10 digits starting with 04'],
            match: [/^0(4)\d{8}$/, 'Your mobile number must be 10 digits starting with 04']
            
        }

})

const User = new mongoose.model("User", userSchema)

const app = express()
// var userID = 0

app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static("public"))




//Getting HTML
app.get('/', (request, response) => 
{
    response.sendFile(__dirname + "/index.html")
    const signup = request.body.signup;
    const login = request.body.login;

})

// Post method
app.post('/', (request, response)=> {
    const firstname = request.body.fname
    const lastname = request.body.lname
    const country = request.body.country
    const email = request.body.email
    const password = request.body.password
    const confpassword = request.body.confpassword
    const address = request.body.address + request.body.address2
    const city = request.body.city
    const state = request.body.state
    const postcode = request.body.postcode
    const number = request.body.mobile
    
    // console.log(mailchimp.ping.get());
    
    if(password != confpassword)
    {
        
        var error = new Error('Passwords do not match')
        throw error.message

        
        
        
    }
    

    
   

    //Checking if the password is blank. Without this check the blank password will be hashed and the password validator won't work
    if(password != "")
    {
        hashedPass = bcrypt.hashSync(password, 10)
    }
    //Setting hashedPass to blank. This is passed to the DB
    else
    {
        hashedPass = ""
    }
    
    const user = new User(
        {
            
            fname: firstname,
            lname: lastname,
            country: country,
            email: email,
            password: hashedPass,
            address: address,
            city: city,
            state: state,
            postcode: postcode,
            number: number
            
        }
    )
    

    //The url for the list we wish to update. 
    const url = "https://us17.api.mailchimp.com/3.0/lists/cbeb323dfb";
    //options including the method and the API key
    const options={
        method:"POST",
        auth: "API_KEY_REDACTED"
    }
    //data to be passed to mailchimp. This is the same data used by the database.
    const data = {
        members:[{
            email_address: email,
            status: "subscribed",
            merge_field:{
                FNAME: firstname,
                LNAME: lastname
            }
        }]
    }
    

    
    user.save().then(function(){
        
        // Redirecting to the log in page
        response.redirect("/")
        
  
    }).then(function(){
              //function to add the user in the mailchimp api
        const APIrequest = https.request(url, options, (response) => {
            response.on("data", (data)=> {
                console.log(JSON.parse(data))
            })
        })
        //converting the data to a JSON object
        jsonUser = JSON.stringify(data);
        //sending data to the api request
        APIrequest.write(jsonUser);
        APIrequest.end();
        console.log(firstname, lastname, email)
    }).catch(function(error){
        console.log(error.message)
        response.send(error.message)
    })

    
})

//post method for the login page
app.post('/login', (request, response)=> {
    // response.send("Login")
    const username = request.body.email;
    const password = request.body.password;
  //Checking for the email entered in the DB
  var mail =  User.findOne({
        email: username
        
    }, function(err, user){
        if(err)
        {
            console.log(err)
        }
        else
        {
            //If there was no user with that email return an error
            if(user == null)
            {
                response.send("Email or password is incorrect")
            }
            //If the email exists check the password entered
            else if(bcrypt.compareSync(password, user.password))
            {
                response.redirect("/reqtask.html")
            }
            // If none of the above is true then the user does not exist
            else
            {
                response.send("Email or password is incorrect")
            }
        }
    })
    

    

    

})
    



app.listen(8080, (request, response)=>{
    console.log("server is running")
})