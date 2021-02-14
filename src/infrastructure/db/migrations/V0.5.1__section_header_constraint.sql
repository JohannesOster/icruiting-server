ALTER TABLE form_field 
  ADD CONSTRAINT section_header_no_intent CHECK(NOT component='section_header' OR intent IS NULL);
