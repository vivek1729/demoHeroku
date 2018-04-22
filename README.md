#Server set up
==============

1. Clone the repo from GitHub
2. If deploying to Heroku, follow instructions i.e. first 4 steps till deployment from [Steps](https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction)
3. Do `heroku login` to log into the heroku tool chain
4. Go to the local folder where the repo was downloaded. Make sure you are on the master branch.
5. `heroku create` to create the application and complete the scaffolding. This step is required once.
6. To deploy further changes, just push to the `heroku` remote by `git push heroku master`
7. Make note of the Heroku deployment URL that would show up in the console.
Eg:
```
remote: -----> Build succeeded!
remote:        ├── ejs@2.4.1
remote:        └── express@4.13.3
remote:
remote: -----> Discovering process types
remote:        Procfile declares types -> web
remote:
remote: -----> Compressing... done, 9.4MB
remote: -----> Launching... done, v8
remote:        http://sharp-rain-871.herokuapp.com deployed to Heroku
```
The string we are looking for is "http://sharp-rain-871.herokuapp.com"


#Client set up
================

1. Go to Look & Feel tab on Qualtrics and click on Advanced.
2. Include these scripts in the Header section:
```<script src="https://code.jquery.com/jquery-3.2.1.min.js" integrity="sha256-hwg4gsxgFZhOsEEamdOYGBf13FyQuiTwlAQgxVSNgt4=" crossorigin="anonymous"></script>
<script>var $jq = jQuery.noConflict()</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.4/socket.io.js"></script>
```
3. Add the following CSS to style the chat window (optional):
```
#chat_app button{

	padding: 1px 7px 2px;
}

#credentials{

	padding: 20px;
}

#output {

	border-radius: 7px;
	margin-left: 10%;
    max-width: 80%;
    height: 300px;
    background: #272822; 
    color: #f3e4b4;
    padding: 10px;
    margin-bottom: 20px;
    overflow-y: scroll;
}

#output .message_string {

	color: #f8f8f2;
}

#chat_input {

	margin-left: 10%;	
}

#chat_text {

	width: 40%;
}
```

4. Go to "General" in the Look & Feel tab and set Page Transitions to "None".
5. Include the `qualtrics_http_setup.js` to test out the HTTP functionality with the Chat app
6. Include the `qualtrics_socket_setup.js` to test out the socket functionality with the Chat app



#Server code rundown
====================
HTTP API's live in `routes->index.js`
Socket API's live in `routes->socket_handler.js`
Data for the survey is persisted in a file named `survey_data.json`
Typical schema of data stored on server for survey:
`{"message":"hello world","user_id":"11","group_id":"1","timestamp":1515986678}`


#Client code rundown
====================
`fetch_messages` method downloads initial messages for a group_id from the server.
`chat_user_id` and `chat_group_id` are the variables that are persisted as Embedded data throughout the Survey. They can be accessed using `Qualtrics.SurveyEngine.getEmbeddedData("chat_user_id");` in JS.
Clicking on the `Fetch Messages` button in the app triggers a get request and fetches message
`Auto refresh` is a checkbox and clicking it triggers a timer that calls the get request every 5 seconds.



#Useful links
=============
* HTTP and Socket server - [Getting started with Heroku and NodeJS](https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction)
* Qualtrics survey - [Qualtrics Question JS API](https://s.qualtrics.com/WRAPI/QuestionAPI/classes/Qualtrics%20JavaScript%20Question%20API.html)
* In-memory data store usign Loki on the server- [LokiJS](https://rawgit.com/techfort/LokiJS/master/jsdoc/index.html)
* SocketIO for real time communication - [Server API](https://socket.io/docs/server-api/)
