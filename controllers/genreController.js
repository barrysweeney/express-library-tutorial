const Genre = require("../models/genre");
const Book = require("../models/book");
const async = require("async");
const validator = require("express-validator");

// Display list of all Genre.
exports.genre_list = function (req, res) {
  Genre.find()
    .populate("genre")
    .sort([["name", "ascending"]])
    .exec(function (err, list_genres) {
      if (err) return next(err);
      res.render("genre_list", {
        title: "Genre List",
        genre_list: list_genres,
      });
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function (req, res, next) {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books: function (callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) return next(err);
      if (results.genre === null) {
        // there are no results
        const err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }

      res.render("genre_detail", {
        title: "Genre Detail",
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// Display Genre create form on GET.
exports.genre_create_get = function (req, res) {
  res.render("genre_form", { title: "Create Genre" });
};

// Handle Genre create on POST.
exports.genre_create_post = [
  // validate body field is not empty
  validator.body("name", "Genre name required").trim().isLength({ min: 1 }),

  // sanitize (escape) the name field
  validator.sanitizeBody("name").escape(),

  // process request afetr validationa nd sanitization
  (req, res, next) => {
    // extract validation errors from request
    const errors = validator.validationResult(req);

    // create a genre object with escaped and trimmed data
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // there are errors, render form again with sanitized values/ error messages
      res.render("genre_form", {
        title: "Create Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // data from form is valid
      // check is Genre with same name already exists
      Genre.findOne({ name: req.body.name }).exec(function (err, found_genre) {
        if (err) {
          return next(err);
        }
        if (found_genre) {
          // Genre existsa, redirect to its detail page
          res.redirect(found_genre.url);
        } else {
          genre.save(function (err) {
            if (err) {
              return next(err);
            }
            // genre saved, redirect to genre detail page
            res.redirect(genre.url);
          });
        }
      });
    }
  },
];

// Display Genre delete form on GET.
exports.genre_delete_get = function (req, res, next) {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genres_books: function (callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.author === null) {
        res.redirect("/catalog/genres");
      }
      // if we got here then it has been succcessful so render
      res.render("genre_delete", {
        title: "Delete Genre",
        genre: results.genre,
        genre_books: results.genres_books,
      });
    }
  );
};

// Handle Genre delete on POST.
exports.genre_delete_post = function (req, res, next) {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.body.genreid).exec(callback);
      },
      genres_books: function (callback) {
        Book.find({ genre: req.body.genreid }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      // Success
      if (results.genres_books.length > 0) {
        // Genre has books. Render in same way as for GET route.
        res.render("genre_delete", {
          title: "Delete Genre",
          genre: results.genre,
          genre_books: results.genres_books,
        });
        return;
      } else {
        // Genre has no books. Delete object and redirect to the list of genres.
        Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
          if (err) {
            return next(err);
          }
          // Success - go to genre list
          res.redirect("/catalog/genres");
        });
      }
    }
  );
};

// Display Genre update form on GET.
exports.genre_update_get = function (req, res) {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre === null) {
        const err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }
      // succesful so render
      res.render("genre_form", {
        title: "Update Genre",
        genre: results.genre,
      });
    }
  );
};

// Handle Genre update on POST.
exports.genre_update_post = [
  // Validate fields.
  // validate body field is not empty
  validator.body("name", "Genre name required").trim().isLength({ min: 1 }),

  // sanitize (escape) the name field
  validator.sanitizeBody("name").escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validator.validationResult(req);

    // Create a Genre object with escaped/trimmed data and old id.
    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id, //This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      async.parallel(function (err, results) {
        if (err) {
          return next(err);
        }

        res.render("genre_form", {
          title: "Update Genre",
          genre: genre,

          errors: errors.array(),
        });
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      Genre.findByIdAndUpdate(req.params.id, genre, {}, function (
        err,
        thegenre
      ) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to book detail page.
        res.redirect(thegenre.url);
      });
    }
  },
];
