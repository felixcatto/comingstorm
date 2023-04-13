# Description

SPA app using NextJs + TypeScript + Postgress. Traditional CRUD blog with ability to add articles, tags and comments. Also have users, authentification and the ability to send messages to other users in chat mode. Live demo - https://rainoffire.ru

### Features

* HTTPS
* Chat on Websockets
* One button deploy \*. So you need only Docker and Git installed on server. Node, Postgress and Caddy will be handled via Docker.
* API tests and database migrations
* Notable techs - NextJs, TypeScript, ObjectionOrm, WebSockets, Jest, CSS Modules, Tailwind, Docker, Postgress, Caddy.

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
make start
```

then go to `http://localhost:3000`

*Deploy*
```
git clone https://github.com/felixcatto/comingstorm.git
cd comingstorm
make compose-build
make compose-up
make compose-migrate # only first time, create database structure
make compose-seed    # only first time, for prepopulate database
```

then go to `http://localhost/`












