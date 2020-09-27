const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const BookInstance = require('../models/bookinstance');
const Book = require('../models/book')
const async = require('async')
// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find()
    .populate('book')
    .exec((err, list_bookinstances) => {
      if (err) {return next(err)}
      res.render('bookinstance_list', {title: 'Book Instance List', bookinstance_list: list_bookinstances})
    })
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function(err, bookinstance) {
      if(err) {return next(err)}
      if(bookinstance==null) {
        let err = new Error('Book copy not found')
        err.status = 404
        return next(err)
      }
      res.render('bookinstance_detail', {title: 'Copy: '+bookinstance.book.title, bookinstance: bookinstance})
    })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
  Book.find({}, 'title')
  .exec(function(err, books) {
    if (err) { return next(err) }
    res.render('bookinstance_form',{title: 'Create BookInstance', book_list: books })
  })
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  body('book', 'Book must be specified').trim().isLength({min: 1}),
  body('imprint', 'Imprint must be specified').trim().isLength({min: 1}),
  body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601(),

  sanitizeBody('book').escape(),
  sanitizeBody('imprint').escape(),
  sanitizeBody('status').trim().escape(),
  sanitizeBody('due_back').toDate(),

  (req, res, next) => {
    const errors = validationResult(req)

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    })

    if(!errors.isEmpty()) {
      Book.find({}, 'title')
      .exec((err, books) => {
        if (err) { return next(err) }
        res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance, status: bookinstance.status })
      })
      return
    }else {
      bookinstance.save((err) => {
        if (err) { return next(err) }
        res.redirect(bookinstance.url)
      })
    }
  }
]

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
  BookInstance.findById(req.params.id)
  .exec((err, results) => {
    if (err) { return next(err); }
      if (results==null) { // No results.
          res.redirect('/catalog/bookinstances');
      }
      res.render('bookinstance_delete', { title: 'Delete BookInstance', bookinstance: results} )
  })
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
  BookInstance.findById(req.params.id)
  .exec((err, results) => {
    if (err) { return next(err); }
    BookInstance.findByIdAndRemove(req.body.instanceid, function deleteInstance(err) {
        if (err) { return next(err); }
        res.redirect('/catalog/bookinstances')
    })
  })
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {

  async.parallel({
    book: function(callback) {
        Book.find({}, 'title').exec(callback);
    },
    book_instance: function(callback) {
        BookInstance.findById(req.params.id).exec(callback)
    },
  }, function(err, results) {
      if (err) { return next(err); }
      if (results.book_instance==null) { // No results.
          var err = new Error('BookInstance not found');
          err.status = 404;
          return next(err);
      }
      res.render('bookinstance_form', { title: 'Update BookInstance', book_list: results.book, bookinstance: results.book_instance });
  });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body('book', 'Book must be specified').trim().isLength({min: 1}),
  body('imprint', 'Imprint must be specified').trim().isLength({min: 1}),
  body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601(),

  sanitizeBody('book').escape(),
  sanitizeBody('imprint').escape(),
  sanitizeBody('status').trim().escape(),
  sanitizeBody('due_back').toDate(),

  (req, res, next) => {
    const errors = validationResult(req)

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id
    })

    if(!errors.isEmpty()) {
      Book.find({}, 'title')
      .exec((err, books) => {
        if (err) { return next(err) }
        res.render('bookinstance_form', { title: 'Update BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance, status: bookinstance.status })
      })
      return
    }else {
      BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, (err, instance) => {
        if (err) { return next(err) }
        res.redirect(instance.url)
      })
    }
  }
]