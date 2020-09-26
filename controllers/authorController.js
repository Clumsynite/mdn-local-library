const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const Author = require('../models/author')
const async = require('async')
const Book = require('../models/book')

exports.author_list = (req, res, next) => {
  Author.find()
  .populate('author')
  .sort([['family_name', 'ascending']])
  .exec(function(err, list_authors) {
    if (err) next(err)
    res.render('author_list', {title: 'Author List', author_list: list_authors})
  })
}

exports.author_detail = (req, res) => {
  
  async.parallel({
    author: function(callback) {
      Author.findById(req.params.id)
          .exec(callback)
    },
    authors_books: function(callback) {
      Book.find({ 'author': req.params.id },'title summary')
      .exec(callback)
    },
  },function(err, results) {
      if (err) { return next(err); } // Error in API usage.
      if (results.author==null) { // No results.
          var err = new Error('Author not found');
          err.status = 404;
          return next(err);
      }
      // Successful, so render.
      res.render('author_detail', { title: 'Author Detail', author: results.author, author_books: results.authors_books } );
  });
}


exports.author_create_get = (req, res) => {
  res.render('author_form', { title: 'Create Author'});
}

exports.author_create_post = [
  body('first_name').isLength({min: 1}).trim().withMessage('First name must be specified').isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
  body('family_name').isLength({min: 1}).trim().withMessage('Family name must be specified').isAlphanumeric().withMessage('Family name has non-alphanumeric characters'),
  body('date_of_birth', 'Invalid date of birth').optional({checkFalsy: true}).isISO8601(),
  body('date_of_death', 'Invalid date of death').optional({checkFalsy: true}).isISO8601(),
  
  sanitizeBody('first_name').escape(),
  sanitizeBody('family_name').escape(),
  sanitizeBody('date_of_birth').toDate(),
  sanitizeBody('date_of_death').toDate(),
  (req, res, next) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
      res.render('author_form', {title: 'Create Author', author: req.body, errors: errors})
      return
    }else {
      const authorData = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death
      })
      authorData.save(function (err) {
          if (err) { return next(err); }
          // Successful - redirect to new author record.
          res.redirect(authorData.url);
      });
    }
  }
]

exports.author_delete_get = (req, res, next) => {
  async.parallel({
    author: function(callback) {
      Author.findById(req.params.id).exec(callback)
    },
    author_books: function(callback) {
      Book.find({'author': req.params.id}).exec(callback)
    },
  }, function(err, results) {
    if(err) { return next(err) }
    if(results.author===null) {
      res.redirect('/catalog/authors')
    }
    res.render('author_delete', {title: 'Delete Author', author: results.author, author_books: results.author_books})
  })
}

exports.author_delete_post = (req, res, next) => {
  async.parallel({
    author: function(callback) {
      Author.findById(req.body.id).exec(callback)
    },
    author_books: function(callback) {
      Book.find({'author': req.params.id}).exec(callback)
    },
  }, function(err, results) {
    if(err) { return next(err) }
    if(results.author_books.length > 0) {
      res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.author_books } );
      return;
    }else {
      Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
          if (err) { return next(err); }
          // Success - go to author list
          res.redirect('/catalog/authors')
      })
  }
  })
}


exports.author_update_get = (req, res) => {
  res.send('NOT IMPLEMENTED: Author update GET')
}

exports.author_update_post = (req, res) => {
  res.send('NOT IMPLEMENTED: Author update POST')
}
