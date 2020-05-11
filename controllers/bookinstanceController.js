const BookInstance = require("../models/bookinstance");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");
const Book = require("../models/book");
const async = require("async");

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res) {
  BookInstance.find()
    .populate("book")
    .exec(function (err, list_bookinstances) {
      if (err) return next(err);
      res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: list_bookinstances,
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res, next) {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec(function (err, bookinstance) {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        // No results.
        var err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("bookinstance_detail", {
        title: "Copy: " + bookinstance.book.title,
        bookinstance: bookinstance,
      });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res) {
  Book.find({}, "title").exec(function (err, books) {
    if (err) {
      return next(err);
    }
    // successful, so render:
    res.render("bookinstance_form", {
      title: "Create BookInstance",
      book_list: books,
      status_list: ["Maintenance", "Available", "Loaned", "Reserved"],
    });
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }),
  body("imprint", "Imprint must be specified").trim().isLength({ min: 1 }),
  body("due_back", "Invalid date").optional({ checkFalsy: true }).isISO8601(),

  // Sanitize fields.
  sanitizeBody("book").escape(),
  sanitizeBody("imprint").escape(),
  sanitizeBody("status").trim().escape(),
  sanitizeBody("due_back").toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    console.log(req.body.status);

    // Create a BookInstance object with escaped and trimmed data.
    var bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, "title").exec(function (err, books) {
        if (err) {
          return next(err);
        }
        // Successful, so render.
        res.render("bookinstance_form", {
          title: "Create BookInstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance: bookinstance,
          status_list: ["Maintenance", "Available", "Loaned", "Reserved"],
        });
      });
      return;
    } else {
      // Data from form is valid.
      bookinstance.save(function (err) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to new record.
        res.redirect(bookinstance.url);
      });
    }
  },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function (req, res, next) {
  async.parallel(
    {
      bookinstance: function (callback) {
        BookInstance.findById(req.params.id).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.bookinstance === null) {
        res.redirect("/catalog/bookinstances");
      }
      // if we got here then it has been succcessful so render
      res.render("bookinstance_delete", {
        title: "Delete Book Instance",
        bookinstance: results.bookinstance,
      });
    }
  );
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function (req, res, next) {
  async.parallel(
    {
      bookinstance: function (callback) {
        BookInstance.findById(req.body.bookinstanceid).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      BookInstance.findByIdAndRemove(
        req.body.bookinstanceid,
        function deleteBookInstance(err) {
          if (err) {
            return next(err);
          }

          res.redirect("/catalog/bookinstances");
        }
      );
    }
  );
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res) {
  async.parallel(
    {
      bookinstance: function (callback) {
        BookInstance.findById(req.params.id).exec(callback);
      },
      book_list: function (callback) {
        Book.find({}).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.bookinstance === null) {
        const err = new Error("Book Instance not found");
        err.status = 404;
        return next(err);
      }
      // succesful so render
      res.render("bookinstance_form", {
        title: "Update Book Instance",
        bookinstance: results.bookinstance,
        book_list: results.book_list,
        status_list: ["Maintenance", "Available", "Loaned", "Reserved"],
      });
    }
  );
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  // Validate fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }),
  body("imprint", "Imprint must be specified").trim().isLength({ min: 1 }),
  body("due_back", "Invalid date").optional({ checkFalsy: true }).isISO8601(),

  // Sanitize fields.
  sanitizeBody("book").escape(),
  sanitizeBody("imprint").escape(),
  sanitizeBody("status").trim().escape(),
  sanitizeBody("due_back").toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped/trimmed data and old id.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      due_back: req.body.due_back,
      status: req.body.status,
      _id: req.params.id, //This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all  books for form.
      async.parallel(
        {
          book_list: function (callback) {
            Book.find(callback);
          },
        },
        function (err, results) {
          if (err) {
            return next(err);
          }

          res.render("bookinstance_form", {
            title: "Update Book Instance",
            bookinstance: bookinstance,
            book_list: results.book_list,
            status_list: ["Maintenance", "Available", "Loaned", "Reserved"],
            errors: errors.array(),
          });
        }
      );
      return;
    } else {
      // Data from form is valid. Update the record.
      BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function (
        err,
        thebookinstance
      ) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to book detail page.
        res.redirect(thebookinstance.url);
      });
    }
  },
];
