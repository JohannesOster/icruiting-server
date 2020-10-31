BEGIN;
SELECT plan(1);

SELECT has_view('ranking');

SELECT * FROM finish();
END;
