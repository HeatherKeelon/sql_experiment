var express = require('express');
var app = express();

var path = require('path');
var bodyParser = require('body-parser');

var pg = require('pg');
var connectionString = "";
var multer = require('multer');
var upload = multer({dest: 'uploads/'});
var type = upload.single('file');
var fs = require('fs');
var copyFrom = require('pg-copy-streams').from;

if (process.env.DATABASE_URL != undefined) {
    connectionString = process.env.DATABASE_URL + "ssl";
} else {
    connectionString = 'postgres://localhost:5432/dummy';
}

app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({expanded: true}));
app.use(bodyParser.urlencoded({extended: true}));

app.post('/upload', type, function (req, res, next) {
    console.log(req.file);

    var tmp_path = req.file.path;
    var target_path ='uploads/' + req.file.name;
    fs.readFile(tmp_path, function (err, data) {
        console.log(data);
        fs.writeFile('uploads/students.csv', data, function (err) {
            console.log("written");
        });
    });

    pg.connect(connectionString, function(err, client, done) {
        if (err) console.log(err);
        client.query("DROP TABLE IF EXISTS newvals;" +
            "CREATE TEMPORARY TABLE newvals(id varchar, firstname varchar, lastname varchar, phone1 varchar, phone2 varchar, email varchar, grade integer, street varchar, city varchar, state varchar, zip integer, class_date date, teacher_email varchar)",
            function (err, result) {
                if (err) console.log("This is a write error", err);
            });

        var stream = client.query(copyFrom("COPY newvals FROM STDIN"));
        var fileStream = fs.createReadStream('uploads/students.csv');
        fileStream.on('error', done);
        fileStream.pipe(stream).on('finish', done).on('error', done);
    });

    pg.connect(connectionString, function(err, client, done){

        client.query("LOCK TABLE students IN EXCLUSIVE MODE; " + console.log("And here") +

                                        "UPDATE students " +
                                        "SET firstname=newvals.firstname, lastname=newvals.lastname, phone1=newvals.phone1, phone2=newvals.phone2, email=newvals.email, grade=newvals.grade, street=newvals.street, city=newvals.city, state=newvals.state, zip=newvals.zip, class_date=newvals.class_date, teacher_email=newvals.teacher_email " +
                                        "FROM newvals " +
                                        "WHERE newvals.id = students.id;" + console.log("After update") +

                                        "DELETE FROM students " +
                                        "WHERE NOT EXISTS ( " +
                                        "SELECT * " +
                                        "FROM newvals " +
                                        "WHERE newvals.id=students.id " +
                                        "); " + console.log("After delete") +

                                        "INSERT INTO students " +
                                        "SELECT newvals.id, newvals.firstname, newvals.lastname, newvals.phone1, newvals.phone2, newvals.email, newvals.grade, newvals.street, newvals.city, newvals.state, newvals.zip, newvals.class_date, newvals.teacher_email " +
                                        "FROM newvals " +
                                        "LEFT OUTER JOIN students ON (students.id = newvals.id) " +
                                        "WHERE students.id IS NULL " +
                                        "RETURNING students.id",
            function (err) {
            console.log("After Insert");
            if (err) console.log("This is err", err);
            client.end();
        });
    });
                //res.render('complete');

    //var tmp_path = req.file.path;
    //var target_path = 'uploads/' + req.file.name;
    //fs.readFile(tmp_path, function (err, data) {
    //    console.log(data);
    //    fs.writeFile('uploads/students.csv', data, function (err) {
    //
    //        //res.render('complete');
    //
    //        pg.connect(connectionString, function (err, client, done) {
    //            if (err) console.log("error after connection", err);
    //            client.query("DROP TABLE IF EXISTS newvals;" +
    //                "CREATE TEMPORARY TABLE newvals(id varchar, firstname varchar, lastname varchar, phone1 varchar, phone2 varchar, email varchar, grade integer, street varchar, city varchar, state varchar, zip integer, class_date date, teacher_email varchar)",
    //                function (err, result) {
    //                    if (err) console.log("This is a write error", err);
    //
    //
    //                    var stream = client.query(copyFrom('COPY newvals FROM STDIN'));
    //                    var fileStream = fs.createReadStream('uploads/students.csv');
    //                    fileStream.on('error', done);
    //                    fileStream.pipe(stream)
    //                        .on('error', done)
    //                        .on('finish', function () {
    //                            console.log("You made it here");
    //                            client.query("LOCK TABLE students IN EXCLUSIVE MODE;" + console.log("And here") +
    //
    //                                "UPDATE students " +
    //                                "SET firstname=newvals.firstname, lastname=newvals.lastname, phone1=newvals.phone1, phone2=newvals.phone2, email=newvals.email, grade=newvals.grade, street=newvals.street, city=newvals.city, state=newvals.state, zip=newvals.zip, class_date=newvals.class_date, teacher_email=newvals.teacher_email " +
    //                                "FROM newvals " +
    //                                "WHERE newvals.id = students.id;" + console.log("After update") +
    //
    //                                "DELETE FROM students " +
    //                                "WHERE NOT EXISTS ( " +
    //                                "SELECT * " +
    //                                "FROM newvals " +
    //                                "WHERE newvals.id=students.id " +
    //                                "); " + console.log("After delete") +
    //
    //                                "INSERT INTO students " +
    //                                "SELECT newvals.id, newvals.firstname, newvals.lastname, newvals.phone1, newvals.phone2, newvals.email, newvals.grade, newvals.street, newvals.city, newvals.state, newvals.zip, newvals.class_date, newvals.teacher_email " +
    //                                "FROM newvals " +
    //                                "LEFT OUTER JOIN students ON (students.id = newvals.id) " +
    //                                "WHERE students.id IS NULL " +
    //                                "RETURNING students.id", function (err) {
    //                                console.log("After Insert");
    //                                if (err) console.log("This is err", err);
    //                                client.end();
    //                            });
    //
    //                        });
    //                });
    //
    //
    //        });
    //
    //    });
    //
    //
    //});
});

app.get("/*", function (req, res) {
    var file = req.params[0] || "/views/index.html";
    res.sendFile(path.join(__dirname, "./public", file));
});

app.set("port", process.env.PORT || 5000);
app.listen(app.get("port"), function () {
    console.log("Listening on port: ", app.get("port"));
});
