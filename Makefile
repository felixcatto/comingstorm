start:
	npx next dev

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
