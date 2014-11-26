const PORT = 3000;
var assert = require('assert')
  , app = require('../app')
  , bookmark = {
      "title": "Google",
      "url":   "http://www.google.com",
      "tags":  [ "google", "search" ]
    }
  , expected_id = 1

// Configure REST API host & URL
require('api-easy')
.describe('bookmarks-rest')
.use('localhost', PORT)
.root('/bookmarks')
.setHeader('Content-Type', 'application/json')
.setHeader('Accept', 'application/json')

// Initially: start server
.expect('Start server', function () {
  app.db.configure({namespace: 'bookmarks-test-rest'});
  app.listen(PORT);
}).next()

// 1. Empty database
.del()
.expect(200)
.next()

// 2. Add a new bookmark
.post(bookmark)
.expect('Has ID', function (err, res, body) {
  var obj;
  assert.doesNotThrow(function() { obj = JSON.parse(body) }, SyntaxError);
  assert.isObject(obj);
  assert.include(obj, 'id');
  assert.equal(expected_id, obj.id);
  bookmark.id = obj.id;
})
.undiscuss().next()

// 3.1. Check that the freshly created bookmark appears
.get()
.expect('Collection', function (err, res, body) {
  var obj;
  assert.doesNotThrow(function() { obj = JSON.parse(body) }, SyntaxError);
  assert.isArray(obj);
  assert.include(obj, '/bookmarks/bookmark/' + expected_id);
})

// 3.2. Get the freshly created bookmark
.get('/bookmark/' + expected_id)
.expect('Found bookmark', function (err, res, body) {
  var obj;
  assert.doesNotThrow(function() { obj = JSON.parse(body) }, SyntaxError);
  assert.deepEqual(obj, bookmark);
})
.next()

// 4. Update bookmark
.put('/bookmark/' + expected_id, {"title": "Google.com"})
.expect('Updated bookmark', function (err, res, body) {
  var obj;
  assert.doesNotThrow(function() { obj = JSON.parse(body) }, SyntaxError);
  bookmark.title = "Google.com";
  assert.deepEqual(obj, bookmark);
})
.next()

// 5. Delete bookmark
.del('/bookmark/' + expected_id)
.expect(200)
.next()

// 6. Check deletion
.get('/bookmark/' + expected_id)
.expect(404)
.next()

// 7. Check all bookmarks are gone
.get()
.expect('Empty database', function (err, res, body) {
  var obj;
  assert.doesNotThrow(function() { obj = JSON.parse(body) }, SyntaxError);
  assert.isArray(obj);
  assert.equal(obj.length, 0);
})

// 8. Test unallowed methods
.post('/bookmark/' + expected_id).expect(405)
.put().expect(405)

// Finally: clean, and stop server
.expect('Clean & exit', function () {
  app.db.deleteAll(function () { app.close() });
})

// Export tests for Vows
.export(module)



if (module.parent === null) {
  app.listen(3000);
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}

Notez qu’on fait les choses bien et que c’est le test lui-même qui est chargé de démarrer et d’arrêter le serveur, ce qui nous permet d’avoir une configuration dédiée aux tests (port différent, et plus tard base différente par exemple). Sauf qu’en l’état, notre application démarre immédiatement, du coup quand on appelle listen(), ça foire un peu
On exécute les tests avec Vows qui est une dépendance de APIEasy, on trouve donc son binaire dans ./node_modules/api-easy/node_modules/.bin. Évidemment, ils échouent tous pour l’instant:
