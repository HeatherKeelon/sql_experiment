# sql_conversion_assignment

Given the mongo delete lecture activity, convert the mongo-based addPerson ajax call to use the Postgres database. You’ll need to get PSQL running on your computer, set up a new database and create a table for the people as such:
```
CREATE TABLE people
(
  id serial NOT NULL,
  name character varying(255) NOT NULL,
  location character varying(255) NOT NULL,
  age integer,
  CONSTRAINT people_pkey PRIMARY KEY (id)
);
```

1. Add 2 new fields (using the ALTER command or using PgAdmin) to the people table to store the spirit animal as a varchar(255) and address as varchar(255).
2. In order to use these columns, you'll have to update the form and client app.js to append these to the DOM.

**NOTE:** The "/data" get route is already updated to select fields with SQL for you. You’ll need to update the SELECT command to work with the new fields, however.

#HARD MODE
Convert the Delete route to Postgres using the correct SQL command. You’ll have to change the _id in index.html to id and make sure the DOM has the correct id from your database for each person.

#PRO MODE
Create a get “/find” route that takes a name and runs a SELECT command, using SQL’s LIKE feature to find similar names.
