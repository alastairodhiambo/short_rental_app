// Alastair Odhiambo

// Tool and Server Setup
const HTTP_PORT = process.env.PORT || 8080;
const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
const path = require('path');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const clientSessions = require('client-sessions');

// Dev
require('dotenv').config();

const RoomModel = require('./public/js/roomModel');
const UserModel = require('./public/js/userModel');

const PHOTODIRECTORY = './public/images/';

// bodyParser
const urlencodedParser = bodyParser.urlencoded({ extended: true });
app.use(urlencodedParser);

app.engine('.hbs', exphbs({ extname: '.hbs' }));
app.set('view engine', '.hbs');

function onHttpStart() {
    console.log('Express http server listening on: ' + HTTP_PORT);
}

// Checks if user is logged in
function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect('/sign_in');
    } else {
        next();
    }
}

// Checks to see if the navbar should be based on whether the user is signed in or not.
function checkTopHeader(req, res, next) {
    if (!req.session.user) {
        res.locals.layout = 'main.hbs';
    } else {
        res.locals.layout = 'active.hbs';
    }
    next();
}

app.use(express.static(path.join(__dirname, '/public/')));

// Sessions
const sessionHash = bcrypt.hashSync('RandomText1234@', 10);
app.use(
    clientSessions({
        cookieName: 'session',
        secret: sessionHash,
        duration: 30 * 60 * 1000,
        activeDuration: 10 * 1000 * 60,
    })
);

// multer
const storage = multer.diskStorage({
    destination: PHOTODIRECTORY,
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage: storage });

// connect to mongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// log when the DB is connected
mongoose.connection.on('open', () => {
    console.log('Database connection open.');
});

// User Data: Helps fill in their name
const userData = [
    {
        u_value: '',
    },
];

// ----- Home Page -----
app.get('/', checkTopHeader, function (req, res) {
    res.render('home', {
        user: req.session.user,
    });
});

// ----- Room Listing ------
app.get('/room_listing', checkTopHeader, (req, res) => {
    RoomModel.find()
        .lean()
        .exec()
        .then((rooms) => {
            res.render('room_listing', {
                user: req.session.user,
                rooms: rooms,
                hasRooms: !!rooms.length,
            });
        });
});

// ----- Room Listing by Location -----
app.post(
    '/room_listing',
    urlencodedParser,
    checkTopHeader,
    function (req, res) {
        RoomModel.find({ location: req.body.location })
            .lean()
            .exec()
            .then((rooms) => {
                res.render('room_listing', {
                    user: req.session.user,
                    location: req.body.location,
                    rooms: rooms,
                    hasRooms: !!rooms.length,
                });
            });
    }
);

// ----- Room Description -----
app.post('/room_description', urlencodedParser, checkTopHeader, (req, res) => {
    RoomModel.findOne({ _id: req.body.id })
        .lean()
        .exec()
        .then((room) => {
            if (!req.session.user) {
                res.render('room_description', {
                    room: room,
                });
            } else {
                res.render('room_description', {
                    user: req.session.user,
                    room: room,
                });
            }
        });
});

// ----- Book a Room -----
app.post(
    '/book_room',
    urlencodedParser,
    ensureLogin,
    checkTopHeader,
    (req, res) => {
        // Booking a room
    }
);

// ----- Sign In or Register to book and redirection -----
app.post('/book_login', urlencodedParser, checkTopHeader, (req, res) => {
    // Sign up or login to book a room
    if (req.body.submit === 'Sign In') {
        res.render('sign_in');
    } else res.render('registration');
});

// Error messages
const emptyError = 'Field below must not be empty';
const emailError = 'Must be a valid email and not empty';
const passwordError =
    'Password must be at least 6 digits, at least one lowercase, at least one uppercase and at least one special character from @ # $ % ^ & *';
const dateError = 'Must enter a date';

// ----- User Registration -----
app.get('/registration', (req, res) => {
    res.render('registration');
});

// ------- User Registration Validation -----
app.post(
    '/register-user',
    urlencodedParser,
    [
        check('email', emailError).isEmail(),
        check('firstname', emptyError).matches(/(?=.{1,})/),
        check('lastname', emptyError).matches(/(?=.{1,})/),
        check('password', passwordError).matches(
            /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{6,})/
        ),
        check('birthday', dateError).isDate(),
    ],
    (req, res) => {
        userData[0].u_value = req.body.firstname + ' ' + req.body.lastname;

        const errors = validationResult(req);

        const errorData = [
            {
                email: '',
                firstname: '',
                lastname: '',
                password: '',
                birthday: '',
                e_value: req.body.email,
                fname_value: req.body.firstname,
                lname_value: req.body.lastname,
            },
        ];

        // Checking the error messages and passing them to the handlebars data object.
        const errorsArray = errors.array();
        for (const i in errorsArray) {
            const param = errorsArray[i].param;
            if (param in errorData[0]) {
                errorData[0][param] = errorsArray[i].msg;
            }
        }

        if (!errors.isEmpty()) {
            res.render('error', {
                data: errorData,
            });
        } else {
            // Encrypt the passwords
            const password = req.body.password;
            const hash = bcrypt.hashSync(password, 10);

            const hostCheck = req.body.hostCheck === 'yes';
            // Add the data to MongoDB
            const newUser = new UserModel({
                email: req.body.email,
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                password: hash,
                host: hostCheck,
                birthday: req.body.birthday,
            });

            newUser.save((err) => {
                if (err) {
                    console.log('There was an error saving the user');
                    errorData[0].email = 'This email is already taken';
                    res.render('error', {
                        data: errorData,
                    });
                } else {
                    req.session.user = {
                        firstname: req.body.firstname,
                        lastname: req.body.lastname,
                        username: req.body.username,
                        password: req.body.password,
                    };

                    delete req.session.user.password;

                    hostCheck
                        ? (req.session.host = true)
                        : (req.session.host = false);

                    res.redirect('/welcome');
                }
            });
        }
    }
);

// ----- Sign In Form -----
app.get('/sign_in', (req, res) => {
    res.render('sign_in');
});

// ---- Sign In Validation -----
app.post(
    '/sign_in_check',
    urlencodedParser,
    [
        check('username', emptyError).matches(/(?=.{1,})/),
        check('password', emptyError).matches(/(?=.{1,})/),
    ],
    async (req, res) => {
        try {
            const username = req.body.username;
            const password = req.body.password;

            const errors = validationResult(req);
            const errorData = [
                {
                    username: '',
                    password: '',
                    u_value: username,
                },
            ];

            // Checking the error messages and passing them to the handlebars data object.
            const errorsArray = errors.array();
            for (const i in errorsArray) {
                const param = errorsArray[i].param;
                if (param in errorData[0]) {
                    errorData[0][param] = errorsArray[i].msg;
                }
            }

            if (!errors.isEmpty()) {
                res.render('sign_in', {
                    data: errorData,
                });
            } else {
                // Check the data in MongoDB for a email or password match
                let passCheck = false;
                let hostCheck = false;
                await UserModel.findOne({ email: username })
                    .lean()
                    .exec()
                    .then((user) => {
                        if (user) {
                            passCheck = bcrypt.compareSync(
                                password,
                                user.password
                            );
                            hostCheck = user.host;
                            userData[0].u_value =
                                user.firstname + ' ' + user.lastname;

                            if (passCheck) {
                                req.session.user = {
                                    firstname: user.firstname,
                                    lastname: user.lastname,
                                    username: user.email,
                                    password: user.password,
                                };

                                hostCheck
                                    ? (req.session.host = true)
                                    : (req.session.host = false);

                                delete req.session.user.password;

                                res.redirect('/welcome');
                            } else {
                                errorData[0].username =
                                    'Username or password does not match.';
                                res.render('sign_in', {
                                    data: errorData,
                                });
                            }
                        } else {
                            errorData[0].username =
                                'Username or password does not match.';
                            res.render('sign_in', {
                                data: errorData,
                            });
                        }
                    });
            }
        } catch (e) {
            console.log(e);
            res.status(500).send('There was an error!');
        }
    }
);

// ----- Welcome User Page -----
app.get('/welcome', ensureLogin, checkTopHeader, (req, res) => {
    // Changes based on host or user
    if (req.session.host) {
        RoomModel.find(/* { host_username: req.session.user.username} */)
            .lean()
            .exec()
            .then((rooms) => {
                res.render('welcome', {
                    data: userData,
                    user: req.session.user,
                    rooms: rooms,
                    hasRooms: !!rooms.length,
                    host: req.session.host,
                });
            });
    } else {
        res.render('welcome', {
            user: req.session.user,
            data: userData,
        });
    }
});

// ----- User Page -----
app.get('/dashboard', ensureLogin, checkTopHeader, (req, res) => {
    // Changes based on host or user
    if (req.session.host) {
        RoomModel.find(/* { host_username: req.session.user.username} */)
            .lean()
            .exec()
            .then((rooms) => {
                res.render('dashboard', {
                    data: userData,
                    user: req.session.user,
                    rooms: rooms,
                    hasRooms: !!rooms.length,
                    host: req.session.host,
                });
            });
    } else {
        res.render('dashboard', {
            user: req.session.user,
            data: userData,
        });
    }
});

// Should add server side validation for adding the rooms to make sure someone doesn't just edit the javascript.

// ----- Add Rooms -----
app.post('/dashboard', upload.single('room_image'), (req, res) => {
    const locals = {
        message: 'Your room was uploaded successfully',
    };

    if (req.body.id === '') {
        const roomMetadata = new RoomModel({
            name: req.body.name,
            description: req.body.description,
            location: req.body.location,
            price: req.body.price,
            filename: req.file.filename,
            host: req.session.user.firstname,
            host_username: req.session.user.username,
        });

        roomMetadata
            .save()
            .then((response) => {
                res.redirect('/dashboard');
            })
            .catch((err) => {
                locals.message = 'There was an error adding your room';

                console.log(err);

                res.render('dashboard', locals);
            });
    } else {
        // Delete Room
        if (req.body.submit === 'Delete Room') {
            /* TO DO: Need to add Amazon S3 uploads and add the delete option to delete the file from storage */

            RoomModel.deleteOne({ _id: req.body.id }, () => {
                res.redirect('/dashboard');
            });
        } else {
            // Update Room
            RoomModel.updateOne(
                { _id: req.body.id },
                {
                    name: req.body.name,
                    description: req.body.description,
                    location: req.body.location,
                    price: req.body.price,
                    filename: req.file.filename,
                    host: req.session.user.firstname,
                    host_username: req.session.user.username,
                },
                () => {
                    res.redirect('/dashboard');
                }
            );
        }
    }
});

// ----- Edit Room -----
app.post(
    '/edit_room',
    urlencodedParser,
    ensureLogin,
    checkTopHeader,
    (req, res) => {
        RoomModel.findOne({ _id: req.body.id })
            .lean()
            .exec()
            .then((room) => {
                res.render('edit_room', {
                    user: req.session.user,
                    room: room,
                });
            });
    }
);

// ----- Log a user out -----
app.get('/logout', (req, res) => {
    req.session.reset();
    res.redirect('/sign_in');
});

// ----- 404 Error Page -----
app.use((req, res) => {
    res.status(404).render('not_found');
});

// setup http server to listen on HTTP_PORT
app.listen(HTTP_PORT, onHttpStart);
