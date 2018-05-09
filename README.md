# Aloft 4

Created by Stanley Sakai


## Run on local machine with docker

Install docker & docker compose

Run `docker-compose up -d --build`
This builds the application, and then runs it in a daemon.
Once the application is running you can view it at `localhost:4000`

### Sign up the initial user account

Goto `localhost:4000/signup`, and use the signup token `root` to sign up the first account. This account will be an administrator account.

### View emails

When running the application in docker, it sends all the emails to a test email address at [ethereal.email](http://ethereal.email)

Look at the console when the application boots with `docker logs aloft4_app_1`

Within the log, there should be a message like this:

```
Using ethereal as a development email server
Username: [username]@ethereal.email
Password: [password]
```

Use these credentials to log into [ethereal.email](http://ethereal.email) in your webbrowser to view the emails that the application sends.
