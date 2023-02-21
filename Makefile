install:
	npm i

start:
	npx next dev

start-test-server:
	INODE_ENV=test NODE_ENV=test npx next dev -p 3002

start-prod-server:
	npx next start

start-ws-server:
	npx gulp startWsServer

start-prod-ws-server: build-wss
	node dist/services/webSocketServer/bin.js

build:
	npx next build

build-wss:
	NODE_ENV=production npx webpack

analyze-bundle:
	ANALYZE=true npx next build

migrate:
	npx knex migrate:latest

migrate-new:
	npx knex migrate:make $(arg)

migrate-rollback:
	npx knex migrate:rollback

migrate-list:
	npx knex migrate:list

database-build:
	docker build -t comingstorm_database services/database

database-up:
	docker run --rm -d -e POSTGRES_PASSWORD=1 \
	-p 5432:5432 \
	-v comingstorm_database:/var/lib/postgresql/data \
	--name=comingstorm_database \
	comingstorm_database

database-down:
	docker stop comingstorm_database

database-seed:
	npx knex --esm seed:run

database-seed-new:
	npx knex seed:make $(arg)

test:
	npx jest --runInBand --watch

test-file:
	npx jest --runInBand --watch $(arg)

test-once:
	npx jest --runInBand

lint:
	npx tsc

css-styles:
	npx sass --no-source-map public/css/src/bootstrap-grid.scss public/css/bootstrap-grid.css
