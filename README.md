# Description

SPA app using  NextJs, Objection orm, Postgres db. Traditional CRUD blog with ability to add articles, tags and comments. Also have users and authentification.

### Requirements

Node, Docker, Git. No need to install Postgres. 

### Commands

*Development*
```
git clone https://github.com/felixcatto/comingstorm.git
cd comingstorm
make install         # only first time, install node packages
make database-build  # only first time, download database image
make database-up
make migrate         # only first time, create database structure
make database-seed   # only first time, for prepopulate database
make start-ws-server
make start           # in another tab, because in first WebSocket server will work
```

then go to `http://localhost:3000`
