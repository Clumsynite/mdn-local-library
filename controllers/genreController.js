const validator = require('express-validator')
const Genre = require('../models/genre');
const Book = require('../models/book')
const async = require('async')

// Display list of all Genre.
exports.genre_list = function(req, res, next) {
  Genre.find()
  .populate('genre')
  .exec(function(err, list_genres) {
    if (err) next(err)
    res.render('genre_list', {title: 'Genre List', genre_list: list_genres})
  })
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res) {
    async.parallel({
      genre: function(callback) {
        Genre.findById(req.params.id).exec(callback)
      },
      genre_books: function(callback) {
          Book.find({ 'genre': req.params.id })
            .exec(callback);
      },
    },function(err, results) {
      if (err) { return next(err); }
      if (results.genre==null) { // No results.
          var err = new Error('Genre not found');
          err.status = 404;
          return next(err);
      }
      // Successful, so render
      res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    })
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', {title: 'Create Genre'})
};

// Handle Genre create on POST.
exports.genre_create_post = [
  validator.body('name', 'Genre name required').trim().isLength({min: 1}),
  validator.sanitizeBody('name').escape(),
  (req, res, next) => {
    const errors = validator.validationResult(req)

    const genre = new Genre({name: req.body.name})

    if(!errors.isEmpty()) {
      res.render('genre_form', {title: "Create Genre", genre: genre, errors: errors.array()})
      return
    }else {
      Genre.findOne({'name': req.body.name})
      .exec((err, found_genre) => {
        if(err) {return next(err)}
        if(found_genre) {
          res.redirect(found_genre.url)
        }else {
          genre.save((err) => {
            if(err) {return next(err)}
            res.redirect(genre.url)
          })
        }
      })
    }
  }
]

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res) {
  async.parallel({
    genre: function(callback) {
      Genre.findById(req.params.id).exec(callback)
    },
    genre_books: function(callback) {
      Book.find({ 'genre': req.params.id }).exec(callback)
    },
  }, function(err, results) {
      if (err) { return next(err); }
      if (results.genre_books==null) { // No results.
          res.redirect('/catalog/genres');
      }
      // Successful, so render.
      res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books } );
  });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    
  async.parallel({
    genre: function(callback) {
      Genre.findById(req.params.id).exec(callback)
    },
    genre_books: function(callback) {
      Book.find({ 'genre': req.params.id }).exec(callback)
    },
  }, function(err, results) {
      if (err) { return next(err); }
      // Success
      if (results.genre_books.length > 0) {
          res.render('genre_delete', { title: 'Delete Genre', author: results.genre, genre_books: results.genre_books } );
          return;
      }
      else {
          Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
              if (err) { return next(err); }
              res.redirect('/catalog/genres')
          })
      }
  });
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res) {
    Genre.findById(req.params.id).exec((err, data) => {
      if(err) {return next(err)}
      if(data==null) {
        const err = new Error('Genre not found')
        err.status = 404
        return next(err)
      }
      res.render('genre_form', {title: 'Update Genre', genre: data})
    })
};

// Handle Genre update on POST.
exports.genre_update_post =  [

  validator.body('name', 'Genre name required').trim().isLength({min: 1}),
  validator.sanitizeBody('name').escape(),
  (req, res, next) => {
    const errors = validator.validationResult(req)

    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id
    })

    if(!errors.isEmpty()) {
      res.render('genre_form', {title: "Update Genre", genre: genre, errors: errors.array()})
      return
    }else {
      Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thegenre) => {
        if (err) { return next(err); }
     
        res.redirect(thegenre.url);
      })
    }
  }
]