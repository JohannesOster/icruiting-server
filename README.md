# icruiting-api

## Naming conventions

Use create, retrieve, update, del, list to name request handlers as well as db api functions.
Example: the request handler for the forms.post endpoint should be called create. The underlying database handler should also be called create.
This creates conistent and predictable interface throughout the whole application. (controller.create and db.forms.create)
