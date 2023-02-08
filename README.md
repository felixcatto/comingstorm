# Description

SPA app using  NextJs, Objection orm, Postgres db. Traditional CRUD blog with ability to add articles, tags and comments. Also have users and authentification.

### Requirements

Node, Docker, Git. No need to install Postgres. 

### Commands

*Development*
```
git clone https://github.com/felixcatto/comingstorm.git
cd comingstorm
make database-build # only first time, download database image
make database-up
make migrate # only first time, create database structure
make database-seed # only first time, for prepopulate database
make start
```

then go to `http://localhost:3000`
